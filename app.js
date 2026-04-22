// resume builder
// писав сам, рефакторив потім - стало тільки гірше
// TODO: нормально переписати функцію збереження колись

const STORAGE_KEY = 'resume_builder_items_v9' // v9 бо попередні поламались і дані зникали
const ACTIVE_KEY  = 'resume_builder_active_id_v9'

// порядок за замовчуванням якщо юзер не чіпав
var defaultOrder = ['contacts', 'skills', 'about', 'experience', 'portfolio']

var BLOCK_TITLES = {
  contacts:   'Контакти',
  skills:     'Навички',
  about:      'Про себе',
  experience: 'Досвід',
  portfolio:  'Портфоліо'
}

// іконки та лейбли контактів
// намагався вивести в один об'єкт - не вийшло красиво, залишив так
var contactLabels = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
  phone: 'Телефон',
  email: 'Email'
}

const contactIcons = {
  telegram: '<i class="fa-brands fa-telegram"></i>',
  viber:    '<i class="fa-brands fa-viber"></i>',
  whatsapp: '<i class="fa-brands fa-whatsapp"></i>',
  phone:    '<i class="fa-solid fa-phone"></i>',
  email:    '<i class="fa-solid fa-at"></i>'
}

var PLATFORM_LABELS = {
  github: 'GitHub', behance: 'Behance', codepen: 'CodePen',
  dribbble: 'Dribbble', gitlab: 'GitLab', linkedin: 'LinkedIn',
  website: 'Website', other: 'Other'
}

const PLATFORM_ICONS = {
  github:   '<i class="fa-brands fa-github"></i>',
  behance:  '<i class="fa-brands fa-behance"></i>',
  codepen:  '<i class="fa-brands fa-codepen"></i>',
  dribbble: '<i class="fa-brands fa-dribbble"></i>',
  gitlab:   '<i class="fa-brands fa-gitlab"></i>',
  linkedin: '<i class="fa-brands fa-linkedin"></i>',
  website:  '<i class="fa-solid fa-globe"></i>',
  other:    '<i class="fa-solid fa-link"></i>'
}

// не мав сили виносити в окремий об'єкт
function getWorkIcon(t) {
  if (t === 'Віддалена робота') return '<i class="fa-solid fa-laptop-house"></i>'
  if (t === 'Робота в офісі')   return '<i class="fa-solid fa-building"></i>'
  if (t === 'Гібридний формат') return '<i class="fa-solid fa-arrows-rotate"></i>'
  if (t === 'Фриланс')          return '<i class="fa-solid fa-briefcase"></i>'
  return '<i class="fa-solid fa-briefcase"></i>'
}

// ============ утиліти ============

// просто генерую унікальний id, нічого складного
function makeId() {
  return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 99999)
}

// TODO: якщо title порожній - підставляти firstName + позиція автоматично
// зараз просто 'Без назви' і ну і ладно

function escapeHtml(s) {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// стара версія - залишив бо нова ламала апостроф в імені "Кам'янець"
// function escapeHtml(s) {
//   const d = document.createElement('div')
//   d.textContent = s
//   return d.innerHTML
// }

function safeFileName(n) {
  return (n || 'resume').replace(/[\\/:*?"<>|]/g, '_').trim()
}

function getContactIcon(type) {
  return contactIcons[type] || '<i class="fa-solid fa-circle"></i>'
}

function getPlatIcon(p) {
  return PLATFORM_ICONS[p] || PLATFORM_ICONS.other
}

// заглушка якщо нічого не завантажено
function makeFallbackPhoto() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
    <rect width="100%" height="100%" fill="#eeeeee"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="70">Photo</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

// дефолтна структура - все порожнє
function emptyResume() {
  return {
    id:             makeId(),
    title:          'Нове резюме',
    template:       'classic',
    accentColor:    '#2f6fed',
    firstName:      '',
    lastName:       '',
    position:       '',
    city:           '',
    workType:       '',
    photoOriginal:  '',
    photoProcessed: '',
    photoScale:     1,
    photoX:         0,
    photoY:         0,
    photoRadius:    10,
    phone:          '',
    email:          '',
    telegram:       '',
    whatsapp:       '',
    viber:          '',
    preferredContacts: ['telegram', 'phone'],
    about:      '',
    skills:     ['HTML / CSS', 'JavaScript'],
    experience: [{ title: '', link: '', bullets: [''] }],
    portfolio:  [{ platform: 'github', title: '', url: '', description: '' }],
    blockOrder: [...defaultOrder]
  }
}

// DOM - тут хаотично але працює, не чіпай
var $sel   = document.getElementById('resumeSelect')
var $title = document.getElementById('resumeTitle')
var $tmpl  = document.getElementById('templateSelect')
var $color = document.getElementById('accentColor')
var $wtype = document.getElementById('workType')

var photoUploadEl    = document.getElementById('photoUpload')
var photoScaleEl     = document.getElementById('photoScale')
var photoXEl         = document.getElementById('photoX')
var photoYEl         = document.getElementById('photoY')
var photoRadiusEl    = document.getElementById('photoRadius')
const photoScaleLabel  = document.getElementById('photoScaleValue')
const photoXLabel      = document.getElementById('photoXValue')
const photoYLabel      = document.getElementById('photoYValue')
const photoRadiusLabel = document.getElementById('photoRadiusValue')

// решта елементів - мав зробити як вище але не встиг
// щоб потім не лізти в DOM кожен раз
const els = {
  firstName: document.getElementById('firstName'),
  lastName:  document.getElementById('lastName'),
  position:  document.getElementById('position'),
  city:      document.getElementById('city'),

  resetPhotoBtn: document.getElementById('resetPhotoEditorBtn'),
  editorPhoto:   document.getElementById('editorPreviewPhoto'),
  editorFrame:   document.getElementById('editorFrame'),

  phone:    document.getElementById('phone'),
  email:    document.getElementById('email'),
  telegram: document.getElementById('telegram'),
  whatsapp: document.getElementById('whatsapp'),
  viber:    document.getElementById('viber'),

  about:      document.getElementById('about'),
  skillsList: document.getElementById('skillsInputs'),
  expList:    document.getElementById('experienceInputs'),
  portList:   document.getElementById('portfolioInputs'),
  orderList:  document.getElementById('blockOrderList'),

  photoWrap:  document.getElementById('previewPhotoWrap'),
  previewImg: document.getElementById('previewPhoto'),

  fullName:   document.getElementById('previewFullName'),
  positionEl: document.getElementById('previewPosition'),
  cityEl:     document.getElementById('previewCity'),
  wtypeEl:    document.getElementById('previewWorkType'),
  badges:     document.getElementById('preferredContactList'),
  contacts:   document.getElementById('previewContacts'),
  aboutEl:    document.getElementById('previewAbout'),
  skillsEl:   document.getElementById('previewSkills'),
  expEl:      document.getElementById('previewExperience'),
  portEl:     document.getElementById('previewPortfolio'),
  resumeEl:   document.getElementById('resume'),
  contentEl:  document.getElementById('contentBlocks'),

  newBtn:  document.getElementById('newResumeBtn'),
  dupBtn:  document.getElementById('duplicateResumeBtn'),
  delBtn:  document.getElementById('deleteResumeBtn'),
  saveBtn: document.getElementById('saveBtn'),
  pdfBtn:  document.getElementById('downloadBtn'),

  addSkill: document.getElementById('addSkillBtn'),
  addExp:   document.getElementById('addExperienceBtn'),
  addPort:  document.getElementById('addPortfolioBtn'),

  exportBtn:   document.getElementById('exportJsonBtn'),
  importInput: document.getElementById('importJsonInput')
}

// стан
let allResumes = loadFromStorage()
let currentId  = localStorage.getItem(ACTIVE_KEY)

// поїхали
init()

function init() {
  if (!allResumes.length) {
    allResumes.push(buildDemo())
    currentId = allResumes[0].id
    saveToStorage()
  }

  // якщо збережений id протух - береш перший
  if (!allResumes.find(r => r.id === currentId)) {
    currentId = allResumes[0].id
  }

  buildSelectOptions()
  fillForm()
  attachListeners()
  redrawPreview()
}

// демо-резюме щоб не було порожньо при першому відкритті
function buildDemo() {
  var r = emptyResume()

  r.title     = 'WordPress Resume'
  r.firstName = 'Артур'
  r.lastName  = 'Остафійчук'
  r.position  = 'WordPress Developer • Elementor'
  r.city      = "м. Кам'янець-Подільський"
  r.workType  = 'Віддалена робота'
  r.phone     = '+380 93 293 62 91'
  r.email     = 'fireeze123@gmail.com'
  r.telegram  = '@Arturrings'
  r.about     = 'WordPress розробник з досвідом понад 3 роки. Працював із Elementor, адаптивною версткою, кастомними правками та створенням сайтів під ключ.'

  r.skills = ['WordPress / Elementor', 'HTML / CSS', 'JavaScript', 'PHP', 'Figma', 'Адаптивна верстка']

  r.experience = [{
    title:   'Розробка сайту для психологічного центру',
    link:    'https://zelengudzyk.com/',
    bullets: [
      'Повна розробка сайту під ключ',
      'Реалізація на WordPress + Elementor',
      'Адаптивна верстка',
      'Базова SEO-оптимізація'
    ]
  }]

  r.portfolio = [
    { platform: 'github',  title: 'GitHub профіль', url: '', description: 'Репозиторії, pet-проєкти, README та код.' },
    { platform: 'codepen', title: 'CodePen демо',   url: '', description: 'Окремі UI-демо та верстка.' }
  ]

  return r
}

// ============ localStorage ============

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    var data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.map(x => patchResume(x))
  } catch(e) {
    console.warn('не змогло прочитати', e)
    return []
  }
}

// patchResume - додає відсутні поля до старих збережених резюме
// раніше тут був switch по версіях але я його видалив бо заплутався
function patchResume(obj) {
  const base   = emptyResume()
  const merged = Object.assign({}, base, obj)

  // масиви окремо - spread їх не мержить нормально, з'ясував болісно
  if (Array.isArray(obj.skills)) {
    merged.skills = obj.skills
  } else {
    merged.skills = base.skills
  }

  if (Array.isArray(obj.experience)) {
    merged.experience = obj.experience
  } else {
    merged.experience = base.experience
  }

  if (Array.isArray(obj.portfolio)) {
    merged.portfolio = obj.portfolio
  } else {
    merged.portfolio = base.portfolio
  }

  if (Array.isArray(obj.preferredContacts)) {
    merged.preferredContacts = obj.preferredContacts
  } else {
    merged.preferredContacts = base.preferredContacts
  }

  if (!Array.isArray(obj.blockOrder) || !obj.blockOrder.length) {
    merged.blockOrder = defaultOrder.slice()
  } else {
    merged.blockOrder = obj.blockOrder.filter(Boolean)
  }

  return merged
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allResumes))
  localStorage.setItem(ACTIVE_KEY, currentId)
}

function getCurrent() {
  return allResumes.find(r => r.id === currentId)
}

// ============ форма ============

function fillForm() {
  const cv = getCurrent()
  if (!cv) return

  $title.value = cv.title || ''
  $tmpl.value  = cv.template || 'classic'
  $color.value = cv.accentColor || '#2f6fed'
  $wtype.value = cv.workType || ''

  els.firstName.value = cv.firstName || ''
  els.lastName.value  = cv.lastName  || ''
  els.position.value  = cv.position  || ''
  els.city.value      = cv.city      || ''

  photoScaleEl.value  = cv.photoScale  != null ? cv.photoScale  : 1
  photoXEl.value      = cv.photoX      != null ? cv.photoX      : 0
  photoYEl.value      = cv.photoY      != null ? cv.photoY      : 0
  photoRadiusEl.value = cv.photoRadius != null ? cv.photoRadius : 10

  els.phone.value    = cv.phone    || ''
  els.email.value    = cv.email    || ''
  els.telegram.value = cv.telegram || ''
  els.whatsapp.value = cv.whatsapp || ''
  els.viber.value    = cv.viber    || ''
  els.about.value    = cv.about    || ''

  // без цього chrome іноді не скидав файл після зміни резюме, дебажив годину
  photoUploadEl.value = ''

  syncCheckboxes(cv.preferredContacts)
  refreshPhotoLabels()
  drawSkillInputs()
  drawExpInputs()
  drawPortInputs()
  drawOrderList()
  refreshEditorThumb()
}

// ============ превью ============

function redrawPreview() {
  const cv = getCurrent()
  if (!cv) return

  var firstName = cv.firstName || ''
  var lastName  = cv.lastName  || ''
  var name      = (firstName + ' ' + lastName).trim()

  els.fullName.textContent   = name || "ІМ'Я ПРІЗВИЩЕ"
  els.positionEl.textContent = cv.position || 'Посада'

  if (cv.city) {
    els.cityEl.innerHTML = '<span class="info-icon"><i class="fa-solid fa-location-dot"></i></span><span>' + escapeHtml(cv.city) + '</span>'
  } else {
    els.cityEl.innerHTML = '<span class="info-icon"><i class="fa-solid fa-location-dot"></i></span><span>Місто</span>'
  }

  if (cv.workType) {
    els.wtypeEl.innerHTML = '<span class="info-icon">' + getWorkIcon(cv.workType) + '</span><span>' + escapeHtml(cv.workType) + '</span>'
  } else {
    els.wtypeEl.innerHTML = '<span class="info-icon"><i class="fa-solid fa-briefcase"></i></span><span>Формат роботи</span>'
  }

  var photo = cv.photoProcessed || makeFallbackPhoto()
  els.previewImg.src = photo

  var radius = cv.photoRadius != null ? cv.photoRadius : 10
  els.photoWrap.style.borderRadius = radius + 'px'

  els.resumeEl.className = 'resume template-' + (cv.template || 'classic')
  els.resumeEl.style.setProperty('--resume-accent', cv.accentColor || '#2f6fed')

  els.aboutEl.textContent = cv.about || ''

  drawBadges(cv)
  drawContactsPreview(cv)
  drawSkillsPreview(cv)
  drawExpPreview(cv)
  drawPortPreview(cv)
  applyOrder(cv)
}

function refreshEditorThumb() {
  const cv = getCurrent()
  if (!cv) return
  els.editorPhoto.src = cv.photoProcessed || makeFallbackPhoto()
  els.editorFrame.style.borderRadius = (cv.photoRadius != null ? cv.photoRadius : 10) + 'px'
}

function refreshPhotoLabels() {
  photoScaleLabel.textContent  = Number(photoScaleEl.value).toFixed(2)
  photoXLabel.textContent      = photoXEl.value + 'px'
  photoYLabel.textContent      = photoYEl.value + 'px'
  photoRadiusLabel.textContent = photoRadiusEl.value + 'px'
}

// ============ рендер блоків ============

function drawBadges(cv) {
  els.badges.innerHTML = ''
  if (!cv.preferredContacts || !cv.preferredContacts.length) return

  for (var i = 0; i < cv.preferredContacts.length; i++) {
    var t  = cv.preferredContacts[i]
    var el = document.createElement('span')
    el.className = 'contact-badge'
    el.innerHTML = '<span>' + getContactIcon(t) + '</span><span>' + (contactLabels[t] || t) + '</span>'
    els.badges.appendChild(el)
  }
}

function drawContactsPreview(cv) {
  els.contacts.innerHTML = ''

  var rows = []
  if (cv.phone    && String(cv.phone).trim())    rows.push({ key: 'phone',    val: cv.phone })
  if (cv.email    && String(cv.email).trim())    rows.push({ key: 'email',    val: cv.email })
  if (cv.telegram && String(cv.telegram).trim()) rows.push({ key: 'telegram', val: cv.telegram })
  if (cv.whatsapp && String(cv.whatsapp).trim()) rows.push({ key: 'whatsapp', val: cv.whatsapp })
  if (cv.viber    && String(cv.viber).trim())    rows.push({ key: 'viber',    val: cv.viber })

  if (!rows.length) {
    els.contacts.innerHTML = '<div class="contact-line"><span class="contact-icon"><i class="fa-solid fa-circle-info"></i></span><span>Контакти не додані</span></div>'
    return
  }

  rows.forEach(function(row) {
    var d = document.createElement('div')
    d.className = 'contact-line'
    d.innerHTML = '<span class="contact-icon">' + getContactIcon(row.key) + '</span><span>' + escapeHtml(row.val) + '</span>'
    els.contacts.appendChild(d)
  })
}

function drawSkillsPreview(cv) {
  els.skillsEl.innerHTML = ''
  var list = cv.skills.filter(s => s && s.trim())

  if (!list.length) {
    var li = document.createElement('li')
    li.textContent = 'Навички не додані'
    els.skillsEl.appendChild(li)
    return
  }

  list.forEach(skill => {
    var li = document.createElement('li')
    li.textContent = skill
    els.skillsEl.appendChild(li)
  })
}

function drawExpPreview(cv) {
  els.expEl.innerHTML = ''

  const hasData = cv.experience.some(item => {
    var hasTitle   = (item.title   || '').trim()
    var hasLink    = (item.link    || '').trim()
    var hasBullets = (item.bullets || []).some(b => (b || '').trim())
    return hasTitle || hasLink || hasBullets
  })

  if (!hasData) {
    var p = document.createElement('p')
    p.textContent = 'Досвід ще не доданий'
    els.expEl.appendChild(p)
    return
  }

  cv.experience.forEach(item => {
    const wrap = document.createElement('div')
    wrap.className = 'exp-preview-item'

    const h4 = document.createElement('h4')
    h4.textContent = item.title || 'Без назви'
    wrap.appendChild(h4)

    if ((item.link || '').trim()) {
      var a     = document.createElement('a')
      a.href    = item.link
      a.target  = '_blank'
      a.rel     = 'noopener noreferrer'
      a.textContent = item.link
      wrap.appendChild(a)
    }

    var bullets = (item.bullets || []).filter(b => (b || '').trim())
    if (bullets.length) {
      var ul = document.createElement('ul')
      bullets.forEach(b => {
        var li = document.createElement('li')
        li.textContent = b
        ul.appendChild(li)
      })
      wrap.appendChild(ul)
    }

    els.expEl.appendChild(wrap)
  })
}

// ліниво але норм - всі поля в одній функції без виносу
function drawPortPreview(cv) {
  els.portEl.innerHTML = ''

  const visible = cv.portfolio.filter(p => {
    return (p.title || '').trim() || (p.url || '').trim() || (p.description || '').trim()
  })

  if (!visible.length) {
    var p = document.createElement('p')
    p.textContent = 'Портфоліо ще не додано'
    els.portEl.appendChild(p)
    return
  }

  visible.forEach(item => {
    const card = document.createElement('div')
    card.className = 'portfolio-card'

    var t    = escapeHtml(item.title || PLATFORM_LABELS[item.platform] || '')
    var url  = escapeHtml(item.url || '')
    var desc = escapeHtml(item.description || '')
    var platLabel = escapeHtml(PLATFORM_LABELS[item.platform] || 'Other')

    var inner = ''
    inner += '<div class="portfolio-card-head">'
    inner += '<span>' + getPlatIcon(item.platform) + '</span>'
    inner += '<span>' + platLabel + '</span>'
    inner += '</div>'
    inner += '<div class="portfolio-card-title">' + t + '</div>'

    if (url) {
      inner += '<a class="portfolio-card-link" href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
    }
    if (desc) {
      inner += '<div class="portfolio-card-desc">' + desc + '</div>'
    }

    card.innerHTML = inner
    els.portEl.appendChild(card)
  })
}

// ============ інпути навичок / досвіду / портфоліо ============

function drawSkillInputs() {
  const cv = getCurrent()
  els.skillsList.innerHTML = ''

  cv.skills.forEach(function(skill, idx) {
    var box = document.createElement('div')
    box.className = 'skill-item'

    var inp = document.createElement('input')
    inp.type        = 'text'
    inp.value       = skill
    inp.placeholder = 'Навичка'

    // getCurrent() всередині бо idx у closure може вже не збігатись після splice
    // з'ясував коли видалення скіллу ламало наступний інпут - дебажив довго
    inp.addEventListener('input', function(e) {
      getCurrent().skills[idx] = e.target.value
      redrawPreview()
    })

    var btn = document.createElement('button')
    btn.type        = 'button'
    btn.className   = 'remove-btn'
    btn.textContent = 'Видалити'
    btn.onclick = function() {
      getCurrent().skills.splice(idx, 1)
      drawSkillInputs()
      redrawPreview()
    }

    box.appendChild(inp)
    box.appendChild(btn)
    els.skillsList.appendChild(box)
  })
}

function drawExpInputs() {
  const cv = getCurrent()
  els.expList.innerHTML = ''

  cv.experience.forEach((exp, i) => {
    const box = document.createElement('div')
    box.className = 'exp-item'

    var titleField = document.createElement('input')
    titleField.type        = 'text'
    titleField.placeholder = 'Назва проєкту'
    titleField.value       = exp.title || ''
    titleField.addEventListener('input', e => {
      getCurrent().experience[i].title = e.target.value
      redrawPreview()
    })

    var linkField = document.createElement('input')
    linkField.type        = 'text'
    linkField.placeholder = 'Посилання'
    linkField.value       = exp.link || ''
    linkField.addEventListener('input', e => {
      getCurrent().experience[i].link = e.target.value
      redrawPreview()
    })

    // буллети - все в один textarea, потім split('\n')
    // TODO: зробити нормальні окремі інпути для кожного пункту як у навичок
    var bulletsField       = document.createElement('textarea')
    bulletsField.rows        = 5
    bulletsField.placeholder = 'Кожен пункт з нового рядка'
    bulletsField.value       = (exp.bullets || []).join('\n')
    bulletsField.addEventListener('input', e => {
      getCurrent().experience[i].bullets = e.target.value.split('\n')
      redrawPreview()
    })

    var removeExpBtn       = document.createElement('button')
    removeExpBtn.type        = 'button'
    removeExpBtn.className   = 'remove-btn'
    removeExpBtn.textContent = 'Видалити досвід'
    removeExpBtn.addEventListener('click', () => {
      const res = getCurrent()
      res.experience.splice(i, 1)
      // мінімум один порожній запис щоб форма не зникала
      if (!res.experience.length) res.experience.push({ title: '', link: '', bullets: [''] })
      drawExpInputs()
      redrawPreview()
    })

    box.appendChild(titleField)
    box.appendChild(linkField)
    box.appendChild(bulletsField)
    box.appendChild(removeExpBtn)
    els.expList.appendChild(box)
  })
}

// ця функція довша ніж хотілось - ліниво розбивати
function drawPortInputs() {
  const cv = getCurrent()
  els.portList.innerHTML = ''

  cv.portfolio.forEach((item, i) => {
    const wrap = document.createElement('div')
    wrap.className = 'portfolio-item'

    var platSel = document.createElement('select')
    platSel.innerHTML = [
      '<option value="github">GitHub</option>',
      '<option value="behance">Behance</option>',
      '<option value="codepen">CodePen</option>',
      '<option value="dribbble">Dribbble</option>',
      '<option value="gitlab">GitLab</option>',
      '<option value="linkedin">LinkedIn</option>',
      '<option value="website">Website</option>',
      '<option value="other">Other</option>'
    ].join('')
    platSel.value = item.platform || 'github'
    platSel.addEventListener('change', e => {
      getCurrent().portfolio[i].platform = e.target.value
      redrawPreview()
    })

    var nameField = document.createElement('input')
    nameField.type        = 'text'
    nameField.placeholder = 'Назва роботи або профілю'
    nameField.value       = item.title || ''
    nameField.addEventListener('input', e => {
      getCurrent().portfolio[i].title = e.target.value
      redrawPreview()
    })

    var urlField = document.createElement('input')
    urlField.type        = 'text'
    urlField.placeholder = 'https://...'
    urlField.value       = item.url || ''
    urlField.addEventListener('input', e => {
      getCurrent().portfolio[i].url = e.target.value
      redrawPreview()
    })

    var descField = document.createElement('textarea')
    descField.rows        = 3
    descField.placeholder = 'Коротко: що це за робота або профіль'
    descField.value       = item.description || ''
    descField.addEventListener('input', e => {
      getCurrent().portfolio[i].description = e.target.value
      redrawPreview()
    })

    var delPortBtn       = document.createElement('button')
    delPortBtn.type        = 'button'
    delPortBtn.className   = 'remove-btn'
    delPortBtn.textContent = 'Видалити посилання'
    delPortBtn.addEventListener('click', () => {
      const res = getCurrent()
      res.portfolio.splice(i, 1)
      if (!res.portfolio.length) {
        res.portfolio.push({ platform: 'github', title: '', url: '', description: '' })
      }
      drawPortInputs()
      redrawPreview()
    })

    wrap.appendChild(platSel)
    wrap.appendChild(nameField)
    wrap.appendChild(urlField)
    wrap.appendChild(descField)
    wrap.appendChild(delPortBtn)
    els.portList.appendChild(wrap)
  })
}

// ============ select зі списком резюме ============

function buildSelectOptions() {
  $sel.innerHTML = ''
  allResumes.forEach(r => {
    var opt       = document.createElement('option')
    opt.value       = r.id
    opt.textContent = r.title || 'Без назви'
    if (r.id === currentId) opt.selected = true
    $sel.appendChild(opt)
  })
}

// ============ drag and drop порядок блоків ============

function drawOrderList() {
  const cv = getCurrent()
  els.orderList.innerHTML = ''

  cv.blockOrder.forEach(id => {
    var item           = document.createElement('div')
    item.className       = 'sortable-item'
    item.draggable       = true
    item.dataset.blockId = id
    item.textContent     = BLOCK_TITLES[id] || id
    els.orderList.appendChild(item)
  })

  hookDnD()
}

// hookDnD перевішує listener щоразу при перемальовці списку
// спочатку робив одноразово але після дублювання резюме dnd ламався - з'ясував через 2 години
function hookDnD() {
  var items = Array.from(els.orderList.querySelectorAll('.sortable-item'))

  items.forEach(el => {
    el.addEventListener('dragstart', () => el.classList.add('dragging'))
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging')
      persistOrder()
    })
  })

  els.orderList.addEventListener('dragover', e => {
    e.preventDefault()
    var dragged = els.orderList.querySelector('.dragging')
    if (!dragged) return
    var after = getDropTarget(els.orderList, e.clientY)
    if (after) {
      els.orderList.insertBefore(dragged, after)
    } else {
      els.orderList.appendChild(dragged)
    }
  })
}

function getDropTarget(container, y) {
  const candidates = Array.from(container.querySelectorAll('.sortable-item:not(.dragging)'))
  let best = { offset: Number.NEGATIVE_INFINITY, element: null }

  candidates.forEach(child => {
    const box    = child.getBoundingClientRect()
    const offset = y - box.top - box.height / 2
    if (offset < 0 && offset > best.offset) {
      best = { offset, element: child }
    }
  })

  return best.element
}

function persistOrder() {
  const cv = getCurrent()
  cv.blockOrder = Array.from(els.orderList.querySelectorAll('.sortable-item')).map(el => el.dataset.blockId)
  applyOrder(cv)
}

// переставляє DOM-блоки в превью відповідно до порядку
function applyOrder(cv) {
  var sidebar  = els.resumeEl.querySelector('.resume-sidebar')
  var content  = els.contentEl
  var blockMap = {}

  els.resumeEl.querySelectorAll('[data-block-id]').forEach(el => {
    blockMap[el.dataset.blockId] = el
  })

  // contacts і skills завжди в сайдбар незалежно від порядку
  // TODO: колись зробити щоб можна було перенести в основну колонку
  cv.blockOrder.forEach(id => {
    var block = blockMap[id]
    if (!block) return
    if (id === 'contacts' || id === 'skills') {
      sidebar.appendChild(block)
    } else {
      content.appendChild(block)
    }
  })
}

// ============ CRUD резюме ============

function createNew() {
  var r   = emptyResume()
  r.title = 'Нове резюме ' + (allResumes.length + 1)
  allResumes.push(r)
  currentId = r.id
  saveToStorage()
  buildSelectOptions()
  fillForm()
  redrawPreview()
}

function duplicateCurrent() {
  const cv = getCurrent()
  if (!cv) return

  var copy  = JSON.parse(JSON.stringify(cv))
  copy.id    = makeId()
  copy.title = (cv.title || 'Resume') + ' (copy)'
  allResumes.push(copy)
  currentId = copy.id
  saveToStorage()
  buildSelectOptions()
  fillForm()
  redrawPreview()
}

function deleteCurrent() {
  if (allResumes.length <= 1) {
    alert('Потрібно хоча б одне резюме')
    return
  }
  const cv = getCurrent()
  if (!confirm('Видалити "' + cv.title + '"?')) return

  allResumes = allResumes.filter(r => r.id !== cv.id)
  currentId  = allResumes[0].id
  saveToStorage()
  buildSelectOptions()
  fillForm()
  redrawPreview()
}

function saveNow() {
  saveToStorage()
  alert('Резюме збережено')
}

// ============ JSON export / import ============

function doExport() {
  const cv = getCurrent()
  var json = JSON.stringify(cv, null, 2)
  var blob = new Blob([json], { type: 'application/json' })
  var url  = URL.createObjectURL(blob)
  var a    = document.createElement('a')
  a.href     = url
  a.download = safeFileName(cv.title || 'resume') + '.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

function doImport(e) {
  const file = e.target.files[0]
  if (!file) return

  var reader  = new FileReader()
  reader.onload = function(ev) {
    try {
      var parsed   = JSON.parse(ev.target.result)
      var imported = patchResume(parsed)
      imported.id  = makeId()

      if (imported.title && imported.title.trim()) {
        imported.title = imported.title + ' (import)'
      } else {
        imported.title = 'Imported Resume ' + (allResumes.length + 1)
      }

      allResumes.push(imported)
      currentId = imported.id
      saveToStorage()
      buildSelectOptions()
      fillForm()
      redrawPreview()
      alert('JSON імпортовано')
    } catch(err) {
      console.warn('import failed', err)
      alert('Файл пошкоджений або неправильний формат')
    } finally {
      // треба скидати value інакше повторний імпорт того самого файлу не спрацює
      e.target.value = ''
    }
  }
  reader.readAsText(file)
}

// ============ фото - canvas ============

function imgFromSrc(src) {
  return new Promise(function(ok, fail) {
    var img   = new Image()
    img.onload  = function() { ok(img) }
    img.onerror = fail
    img.src = src
  })
}

// bakePhoto - малює фото на canvas з трансформаціями
// SIZE = 1200 бо менше - pixelated на retina, більше - важке для localStorage
async function bakePhoto(originalSrc, cfg) {
  const img  = await imgFromSrc(originalSrc)
  const SIZE = 1200

  var canvas  = document.createElement('canvas')
  canvas.width  = SIZE
  canvas.height = SIZE
  var ctx     = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, SIZE, SIZE)

  var sc   = Number(cfg.photoScale != null ? cfg.photoScale : 1)
  var dx   = Number(cfg.photoX     != null ? cfg.photoX     : 0)
  var dy   = Number(cfg.photoY     != null ? cfg.photoY     : 0)
  var base = Math.max(SIZE / img.width, SIZE / img.height)
  var fScale = base * sc

  var dw = img.width  * fScale
  var dh = img.height * fScale

  // * 2 бо слайдер від -250 до 250 але canvas 1200px - треба масштабувати
  var px = (SIZE - dw) / 2 + dx * 2
  var py = (SIZE - dh) / 2 + dy * 2

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, px, py, dw, dh)

  return canvas.toDataURL('image/jpeg', 0.96)
}

async function rebakeAndDraw() {
  const cv = getCurrent()
  if (!cv) return

  if (!cv.photoOriginal) {
    cv.photoProcessed = ''
    redrawPreview()
    refreshEditorThumb()
    return
  }

  try {
    cv.photoProcessed = await bakePhoto(cv.photoOriginal, cv)
  } catch(e) {
    console.warn('фото не запеклось:', e)
  }

  redrawPreview()
  refreshEditorThumb()
}

async function onPhotoFile(e) {
  var file = e.target.files[0]
  if (!file) return

  var reader  = new FileReader()
  reader.onload = async function(ev) {
    getCurrent().photoOriginal = ev.target.result
    await rebakeAndDraw()
  }
  reader.readAsDataURL(file)
}

async function resetPhotoSettings() {
  const cv     = getCurrent()
  cv.photoScale  = 1
  cv.photoX      = 0
  cv.photoY      = 0
  cv.photoRadius = 10

  // явно прописую як рядок - без цього firefox іноді не скидав range-слайдер візуально
  photoScaleEl.value  = '1'
  photoXEl.value      = '0'
  photoYEl.value      = '0'
  photoRadiusEl.value = '10'

  refreshPhotoLabels()
  await rebakeAndDraw()
}

// ============ PDF ============
// TODO: зробити нормальний прогрес-бар або хоча б disabled на кнопку під час генерації

async function makePDF() {
  const cv = getCurrent()

  if (!window.html2pdf) {
    alert('PDF бібліотека не завантажилась. Перевір інтернет або відкрий сторінку ще раз.')
    return
  }

  // клон щоб не рушити живий DOM під час рендеру
  var clone = els.resumeEl.cloneNode(true)
  clone.style.cssText = 'width:794px;max-width:794px;margin:0;border-radius:0;box-shadow:none;min-height:auto;transform:none;'

  var container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#fff;z-index:-1;'
  container.appendChild(clone)
  document.body.appendChild(container)

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready.catch(() => {})
    }

    // чекаємо поки всі img завантажаться в клоні
    var imgs = Array.from(clone.querySelectorAll('img'))
    await Promise.all(imgs.map(img => new Promise(res => {
      if (img.complete && img.naturalWidth > 0) { res(); return }
      img.addEventListener('load',  res, { once: true })
      img.addEventListener('error', res, { once: true })
    })))

    // scale:3 - менше дає мило, більше - важкий файл і chrome крашиться на великих резюме
    await window.html2pdf().set({
      margin:   [0.2, 0.2, 0.2, 0.2],
      filename: safeFileName(cv.title || 'resume') + '.pdf',
      image:    { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale:           3,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: '#ffffff',
        logging:         false,
        imageTimeout:    15000
      },
      jsPDF:     { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(clone).save()

  } catch(err) {
    console.warn('pdf fail:', err)
    alert('Не вийшло створити PDF')
  } finally {
    container.remove()
  }
}

// ============ чекбокси "куди краще" ============

function syncCheckboxes(selected) {
  document.querySelectorAll('.contact-preferred').forEach(cb => {
    cb.checked = selected.includes(cb.value)
  })
}

function readPreferredFromUI() {
  var checked = Array.from(document.querySelectorAll('.contact-preferred:checked'))
  getCurrent().preferredContacts = checked.map(el => el.value)
  redrawPreview()
}

// ============ всі слухачі ============

function attachListeners() {
  $sel.addEventListener('change', function(e) {
    currentId = e.target.value
    saveToStorage()
    fillForm()
    redrawPreview()
  })

  $title.addEventListener('input', function(e) {
    getCurrent().title = e.target.value
    buildSelectOptions()
  })

  $tmpl.addEventListener('change', function(e) {
    getCurrent().template = e.target.value
    redrawPreview()
  })

  $color.addEventListener('input', function(e) {
    getCurrent().accentColor = e.target.value
    redrawPreview()
  })

  $wtype.addEventListener('change', function(e) {
    getCurrent().workType = e.target.value
    redrawPreview()
  })

  els.firstName.addEventListener('input', e => { getCurrent().firstName = e.target.value; redrawPreview() })
  els.lastName.addEventListener('input',  e => { getCurrent().lastName  = e.target.value; redrawPreview() })
  els.position.addEventListener('input',  e => { getCurrent().position  = e.target.value; redrawPreview() })
  els.city.addEventListener('input',      e => { getCurrent().city      = e.target.value; redrawPreview() })

  photoUploadEl.addEventListener('change', onPhotoFile)

  photoScaleEl.addEventListener('input', async function(e) {
    getCurrent().photoScale = Number(e.target.value)
    refreshPhotoLabels()
    await rebakeAndDraw()
  })

  photoXEl.addEventListener('input', async function(e) {
    getCurrent().photoX = Number(e.target.value)
    refreshPhotoLabels()
    await rebakeAndDraw()
  })

  photoYEl.addEventListener('input', async function(e) {
    getCurrent().photoY = Number(e.target.value)
    refreshPhotoLabels()
    await rebakeAndDraw()
  })

  photoRadiusEl.addEventListener('input', function(e) {
    getCurrent().photoRadius = Number(e.target.value)
    refreshPhotoLabels()
    // radius не потребує rebake - просто css borderRadius
    redrawPreview()
    refreshEditorThumb()
  })

  els.resetPhotoBtn.addEventListener('click', resetPhotoSettings)

  els.phone.addEventListener('input',    e => { getCurrent().phone    = e.target.value; redrawPreview() })
  els.email.addEventListener('input',    e => { getCurrent().email    = e.target.value; redrawPreview() })
  els.telegram.addEventListener('input', e => { getCurrent().telegram = e.target.value; redrawPreview() })
  els.whatsapp.addEventListener('input', e => { getCurrent().whatsapp = e.target.value; redrawPreview() })
  els.viber.addEventListener('input',    e => { getCurrent().viber    = e.target.value; redrawPreview() })

  document.querySelectorAll('.contact-preferred').forEach(cb => {
    cb.addEventListener('change', readPreferredFromUI)
  })

  els.about.addEventListener('input', e => {
    getCurrent().about = e.target.value
    redrawPreview()
  })

  els.addSkill.addEventListener('click', function() {
    getCurrent().skills.push('')
    drawSkillInputs()
    redrawPreview()
  })

  els.addExp.addEventListener('click', function() {
    getCurrent().experience.push({ title: '', link: '', bullets: [''] })
    drawExpInputs()
    redrawPreview()
  })

  els.addPort.addEventListener('click', function() {
    getCurrent().portfolio.push({ platform: 'github', title: '', url: '', description: '' })
    drawPortInputs()
    redrawPreview()
  })

  els.newBtn.addEventListener('click',  createNew)
  els.dupBtn.addEventListener('click',  duplicateCurrent)
  els.delBtn.addEventListener('click',  deleteCurrent)
  els.saveBtn.addEventListener('click', saveNow)
  els.pdfBtn.addEventListener('click',  makePDF)

  els.exportBtn.addEventListener('click',    doExport)
  els.importInput.addEventListener('change', doImport)
}
