// ============================================================
// 智慧学堂 - 后端服务 (Express)
// ============================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================
// 数据管理
// ============================================================
function generateDemoSlides(topic) {
  const slides = [];
  const contents = {
    '安全': [
      { title: '安全生产培训', subtitle: '安全第一 · 预防为主' },
      { title: '安全生产法规', subtitle: '相关法律法规解读' },
      { title: '危险源辨识', subtitle: '如何识别工作中的安全隐患' },
      { title: '操作规程', subtitle: '标准作业流程详解' },
      { title: '应急处理', subtitle: '突发事件应对措施' }
    ],
    '质量': [
      { title: '质量管理体系', subtitle: 'IATF 16949 标准培训' },
      { title: '质量意识', subtitle: '质量是企业的生命线' },
      { title: '三检制', subtitle: '自检 · 互检 · 专检' },
      { title: '问题闭环', subtitle: 'PDCA循环与持续改进' },
      { title: '总结', subtitle: '全员参与 · 持续改进' }
    ],
    '焊接': [
      { title: '焊接技能入门', subtitle: '理论基础 · 实操技巧' },
      { title: '焊接原理', subtitle: '熔化焊的基本原理' },
      { title: '焊接材料', subtitle: '焊条、焊丝、保护气体' },
      { title: '操作技巧', subtitle: '运条方法与焊接参数' },
      { title: '质量检验', subtitle: '外观检查与无损检测' }
    ]
  };
  const items = contents[topic] || contents['安全'];
  items.forEach((item, i) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs><linearGradient id="g${i}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea"/>
        <stop offset="100%" style="stop-color:#764ba2"/>
      </linearGradient></defs>
      <rect width="800" height="600" fill="url(#g${i})"/>
      <text x="400" y="260" text-anchor="middle" fill="white" font-size="48" font-family="Microsoft YaHei, sans-serif" font-weight="bold">${item.title}</text>
      <text x="400" y="320" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="22" font-family="Microsoft YaHei, sans-serif">${item.subtitle}</text>
      <text x="400" y="520" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="16" font-family="Microsoft YaHei, sans-serif">第 ${i+1} 页 / 共 ${items.length} 页</text>
    </svg>`;
    slides.push('data:image/svg+xml;base64,' + Buffer.from(svg, 'utf-8').toString('base64'));
  });
  return slides;
}

function initDefaultData() {
  return {
    courses: [
      {
        id: 'c1',
        name: '安全生产培训',
        desc: '企业安全生产基础知识、操作规程与应急处理',
        type: 'slide',
        icon: '🛡️',
        coverClass: 'alt2',
        slides: generateDemoSlides('安全'),
        video: null,
        attachments: [],
        createdAt: Date.now() - 86400000 * 5,
        teacherId: 't_demo'
      },
      {
        id: 'c2',
        name: '质量管理体系',
        desc: 'IATF 16949质量管理体系标准与实践',
        type: 'slide',
        icon: '📊',
        coverClass: 'alt1',
        slides: generateDemoSlides('质量'),
        video: null,
        attachments: [],
        createdAt: Date.now() - 86400000 * 3,
        teacherId: 't_demo'
      },
      {
        id: 'c3',
        name: '焊接技能入门',
        desc: '焊接基础工艺、操作技巧与质量检验',
        type: 'slide',
        icon: '🔧',
        coverClass: 'alt3',
        slides: generateDemoSlides('焊接'),
        video: null,
        attachments: [],
        createdAt: Date.now() - 86400000 * 1,
        teacherId: 't_demo'
      }
    ],
    teachers: [
      { id: 't_demo', name: '张老师', password: '123456' }
    ],
    students: [],
    progress: {},
    checkins: {}
  };
}

let db = null;

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = JSON.parse(raw);
      console.log('📦 数据库加载成功');
    } else {
      db = initDefaultData();
      saveDB();
      console.log('🆕 初始化默认数据库');
    }
  } catch (e) {
    console.error('数据库加载失败:', e);
    db = initDefaultData();
    saveDB();
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('保存数据库失败:', e);
    return false;
  }
}

// 定时保存（防止意外丢失）
setInterval(() => {
  saveDB();
}, 60000); // 每分钟保存一次

loadDB();

// ============================================================
// 中间件
// ============================================================
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// 用户相关 API
// ============================================================

// 登录 / 注册
app.post('/api/login', (req, res) => {
  const { role, name, password } = req.body;
  
  if (!role || !name) {
    return res.json({ success: false, message: '参数不完整' });
  }

  if (role === 'teacher') {
    let teacher = db.teachers.find(t => t.name === name);
    if (!teacher) {
      teacher = { id: 't_' + Date.now(), name, password: password || '' };
      db.teachers.push(teacher);
      saveDB();
      return res.json({ success: true, user: teacher, message: '注册成功' });
    }
    if (teacher.password && password !== teacher.password) {
      return res.json({ success: false, message: '密码错误' });
    }
    return res.json({ success: true, user: teacher, message: '登录成功' });
  } else {
    let student = db.students.find(s => s.name === name);
    if (!student) {
      student = { id: 's_' + Date.now(), name, password: password || '' };
      db.students.push(student);
      db.checkins[student.id] = {};
      saveDB();
      return res.json({ success: true, user: student, message: '注册成功' });
    }
    if (student.password && password !== student.password) {
      return res.json({ success: false, message: '密码错误' });
    }
    return res.json({ success: true, user: student, message: '登录成功' });
  }
});

// 获取所有学生（老师端）
app.get('/api/students', (req, res) => {
  const { teacherId } = req.query;
  if (!teacherId) return res.json({ success: false, message: '参数错误' });
  
  const students = db.students.map(s => {
    const checkins = db.checkins[s.id] || {};
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let d = new Date();
    if (!checkins[today]) d.setDate(d.getDate() - 1);
    while (true) {
      const ds = d.toISOString().split('T')[0];
      if (checkins[ds]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return { ...s, streak, totalCheckins: Object.keys(checkins).filter(k => checkins[k]).length };
  });
  
  res.json({ success: true, students });
});

// ============================================================
// 课程相关 API
// ============================================================

// 获取所有课程
app.get('/api/courses', (req, res) => {
  const { teacherId, studentId } = req.query;
  let courses = db.courses;
  
  // 如果指定了老师，只返回该老师的课程
  if (teacherId) {
    courses = courses.filter(c => c.teacherId === teacherId);
  }
  
  // 返回时去掉大文件内容（slides/video的data），减少传输量
  const result = courses.map(c => {
    const course = { ...c };
    if (course.type === 'slide' && course.slides) {
      course.slideCount = course.slides.length;
      delete course.slides;
    }
    if (course.type === 'video' && course.video) {
      course.videoSize = course.video.size;
      course.videoName = course.video.name;
      delete course.video;
    }
    return course;
  });
  
  res.json({ success: true, courses: result });
});

// 获取单门课程详情（含完整内容）
app.get('/api/courses/:id', (req, res) => {
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.json({ success: false, message: '课程不存在' });
  }
  res.json({ success: true, course });
});

// 创建课程
app.post('/api/courses', (req, res) => {
  const { name, desc, type, slides, video, attachments, teacherId } = req.body;
  
  if (!name || !teacherId) {
    return res.json({ success: false, message: '参数不完整' });
  }
  if (type === 'slide' && (!slides || slides.length === 0)) {
    return res.json({ success: false, message: '请上传课件' });
  }
  if (type === 'video' && !video) {
    return res.json({ success: false, message: '请上传视频' });
  }

  const iconMap = ['📖', '📊', '🔧', '🎯', '💡', '🛡️', '🚀', '⭐'];
  const coverMap = ['', 'alt1', 'alt2', 'alt3', 'alt4'];

  const newCourse = {
    id: 'c_' + Date.now(),
    name,
    desc: desc || '',
    type: type || 'slide',
    icon: iconMap[Math.floor(Math.random() * iconMap.length)],
    coverClass: coverMap[Math.floor(Math.random() * coverMap.length)],
    slides: type === 'slide' ? slides : [],
    video: type === 'video' ? video : null,
    attachments: attachments || [],
    createdAt: Date.now(),
    teacherId
  };

  db.courses.unshift(newCourse);
  saveDB();
  
  // 返回精简版
  const result = { ...newCourse };
  delete result.slides;
  delete result.video;
  
  res.json({ success: true, course: result, message: '创建成功' });
});

// 更新课程
app.put('/api/courses/:id', (req, res) => {
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.json({ success: false, message: '课程不存在' });
  }

  const { name, desc, type, slides, video, attachments } = req.body;
  
  if (name) course.name = name;
  if (desc !== undefined) course.desc = desc;
  if (type) course.type = type;
  if (slides && type === 'slide') course.slides = slides;
  if (video && type === 'video') course.video = video;
  if (attachments) course.attachments = attachments;
  
  saveDB();
  res.json({ success: true, message: '更新成功' });
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
  const idx = db.courses.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    return res.json({ success: false, message: '课程不存在' });
  }
  
  const courseId = req.params.id;
  db.courses.splice(idx, 1);
  
  // 清理相关进度
  Object.keys(db.progress).forEach(sid => {
    if (db.progress[sid][courseId]) delete db.progress[sid][courseId];
  });
  
  saveDB();
  res.json({ success: true, message: '删除成功' });
});

// ============================================================
// 学习进度 API
// ============================================================

// 获取学生的学习进度
app.get('/api/progress/:studentId', (req, res) => {
  const { studentId } = req.params;
  const progress = db.progress[studentId] || {};
  res.json({ success: true, progress });
});

// 保存学习进度
app.post('/api/progress', (req, res) => {
  const { studentId, courseId, currentPage, completed } = req.body;
  
  if (!studentId || !courseId) {
    return res.json({ success: false, message: '参数不完整' });
  }

  if (!db.progress[studentId]) db.progress[studentId] = {};
  
  const prev = db.progress[studentId][courseId]?.currentPage || 0;
  db.progress[studentId][courseId] = {
    currentPage: Math.max(prev, currentPage || 0),
    completed: completed || false,
    lastUpdate: Date.now()
  };
  
  saveDB();
  res.json({ success: true });
});

// ============================================================
// 打卡 API
// ============================================================

// 获取学生打卡记录
app.get('/api/checkins/:studentId', (req, res) => {
  const { studentId } = req.params;
  const checkins = db.checkins[studentId] || {};
  
  // 计算连续天数
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let d = new Date();
  if (!checkins[today]) d.setDate(d.getDate() - 1);
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (checkins[ds]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  
  const total = Object.keys(checkins).filter(k => checkins[k]).length;
  res.json({ success: true, checkins, streak, total });
});

// 打卡
app.post('/api/checkins', (req, res) => {
  const { studentId, date } = req.body;
  
  if (!studentId) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const checkDate = date || new Date().toISOString().split('T')[0];
  
  if (!db.checkins[studentId]) db.checkins[studentId] = {};
  
  if (db.checkins[studentId][checkDate]) {
    return res.json({ success: false, message: '今天已经打过卡了' });
  }
  
  db.checkins[studentId][checkDate] = true;
  saveDB();
  
  // 重新计算连续天数
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let d = new Date();
  if (!db.checkins[studentId][today]) d.setDate(d.getDate() - 1);
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (db.checkins[studentId][ds]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  
  res.json({ success: true, streak, message: '打卡成功' });
});

// ============================================================
// 数据导出/导入（用于备份）
// ============================================================

app.get('/api/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=zhxt-backup.json');
  res.send(JSON.stringify(db, null, 2));
});

app.post('/api/import', (req, res) => {
  try {
    db = req.body;
    saveDB();
    res.json({ success: true, message: '数据导入成功' });
  } catch (e) {
    res.json({ success: false, message: '导入失败: ' + e.message });
  }
});

// ============================================================
// 首页路由
// ============================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// 启动服务
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 智慧学堂服务已启动`);
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  console.log(`📁 数据文件: ${DATA_FILE}\n`);
});
