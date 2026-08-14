/**
 * 智能记账 — 自然语言解析引擎（纯离线，无网络依赖）
 * 把「中午吃面15」「昨天打车22元」「工资8000」这样的句子
 * 解析成金额 / 类型 / 分类 / 子分类 / 日期 / 备注
 */
import dayjs from 'dayjs';

export interface ParsedBill {
  amount: number;
  type: 'expense' | 'income';
  categoryId?: number;
  subCategoryId?: number;
  date?: string; // YYYY-MM-DD
  note?: string;
  confidence: 'high' | 'medium';
}

interface SubRule {
  keywords: string[];
  name: string;
}

interface CategoryRule {
  keywords: string[];
  code: string;
  subs?: SubRule[];
}

/* ---------------- 支出分类规则 ---------------- */
const EXPENSE_RULES: CategoryRule[] = [
  {
    keywords: ['外卖', '奶茶', '咖啡', '吃', '饭', '餐', '面', '粉', '火锅', '烧烤', '早餐', '午饭', '晚饭', '夜宵', '聚餐', '零食', '饮料', '食堂', '米线', '饺子', '汉堡', '炸鸡', '请客'],
    code: 'food',
    subs: [
      { keywords: ['外卖'], name: '外卖' },
      { keywords: ['奶茶', '咖啡', '饮料', '零食'], name: '零食饮料' },
      { keywords: ['聚餐', '请客'], name: '聚餐应酬' },
      { keywords: ['早餐', '午饭', '晚饭', '夜宵', '饭', '餐', '食堂', '面', '粉', '米线', '饺子'], name: '日常三餐' },
    ],
  },
  {
    keywords: ['打车', '滴滴', '出租', '地铁', '公交', '车费', '加油', '充电', '停车', '高铁', '火车', '机票', '飞机', '出行', '单车', '骑行', '过路费'],
    code: 'transport',
    subs: [
      { keywords: ['打车', '滴滴', '出租'], name: '出租车/网约车' },
      { keywords: ['地铁', '公交'], name: '公共交通' },
      { keywords: ['加油', '充电'], name: '加油充电' },
      { keywords: ['停车'], name: '停车费' },
      { keywords: ['高铁', '火车', '机票', '飞机'], name: '长途出行' },
    ],
  },
  {
    keywords: ['书', '课程', '培训', '学费', '文具', '考试', '报名'],
    code: 'education',
    subs: [
      { keywords: ['课程', '培训'], name: '培训课程' },
      { keywords: ['书'], name: '书籍资料' },
      { keywords: ['文具'], name: '文具用品' },
    ],
  },
  {
    keywords: ['买', '购', '淘宝', '京东', '拼多多', '超市', '衣服', '鞋', '包', '数码', '手机', '电脑', '耳机', '日用', '化妆品', '家具', '电器', '零食大礼包'],
    code: 'shopping',
    subs: [
      { keywords: ['日用', '超市'], name: '日用百货' },
      { keywords: ['衣服', '鞋', '包'], name: '服饰鞋包' },
      { keywords: ['数码', '手机', '电脑', '耳机'], name: '数码产品' },
      { keywords: ['家具', '电器'], name: '家居用品' },
    ],
  },
  {
    keywords: ['房租', '租金', '水电', '燃气', '电费', '水费', '物业', '维修', '装修', '房贷'],
    code: 'housing',
    subs: [
      { keywords: ['房租', '租金'], name: '房租' },
      { keywords: ['水电', '燃气', '电费', '水费'], name: '水电燃气' },
      { keywords: ['物业'], name: '物业费' },
      { keywords: ['维修', '装修'], name: '维修装修' },
    ],
  },
  {
    keywords: ['电影', '游戏', '充值', 'ktv', '唱歌', '旅游', '旅行', '健身', '门票', '演出', '剧本杀', '麻将', '会员'],
    code: 'entertainment',
    subs: [
      { keywords: ['电影', '演出'], name: '电影演出' },
      { keywords: ['游戏', '充值'], name: '游戏充值' },
      { keywords: ['健身'], name: '运动健身' },
      { keywords: ['旅游', '旅行'], name: '旅游度假' },
    ],
  },
  {
    keywords: ['药', '医院', '体检', '看病', '美容', '护肤', '牙', '口罩'],
    code: 'health',
    subs: [
      { keywords: ['药', '医院', '看病'], name: '看病买药' },
      { keywords: ['体检'], name: '体检保健' },
      { keywords: ['美容', '护肤'], name: '美容护肤' },
    ],
  },
  {
    keywords: ['红包', '送礼', '礼金', '孝敬', '捐款', '份子'],
    code: 'social',
    subs: [
      { keywords: ['红包', '礼金', '份子'], name: '红包礼金' },
      { keywords: ['孝敬'], name: '孝敬长辈' },
      { keywords: ['捐款'], name: '慈善捐款' },
    ],
  },
  {
    keywords: ['快递', '宠物', '猫粮', '狗粮', '其他'],
    code: 'other',
    subs: [
      { keywords: ['快递'], name: '快递物流' },
      { keywords: ['宠物', '猫粮', '狗粮'], name: '宠物用品' },
    ],
  },
];

/* ---------------- 收入分类规则 ---------------- */
const INCOME_RULES: CategoryRule[] = [
  {
    keywords: ['工资', '薪水', '发薪', '月薪', '年终奖'],
    code: 'salary',
    subs: [
      { keywords: ['工资', '薪水', '月薪'], name: '月薪' },
      { keywords: ['年终奖', '奖金'], name: '奖金' },
    ],
  },
  {
    keywords: ['兼职', '稿费', '接单', '外快'],
    code: 'parttime',
    subs: [{ keywords: ['接单'], name: '接单' }, { keywords: ['稿费'], name: '稿费' }],
  },
  {
    keywords: ['利息', '基金', '股票', '理财', '收益', '分红'],
    code: 'invest',
  },
  {
    keywords: ['红包', '礼金', '份子'],
    code: 'gift',
  },
  {
    keywords: ['退款', '二手', '闲置', '卖', '报销', '补贴', '返现', '收到'],
    code: 'income_other',
  },
];

/** 判断文本是否为收入类 */
function detectType(text: string): 'expense' | 'income' {
  const lower = text.toLowerCase();
  return INCOME_RULES.some((r) => r.keywords.some((k) => lower.includes(k.toLowerCase())))
    ? 'income'
    : 'expense';
}

/** 解析日期词 */
function parseDate(text: string): string | undefined {
  const today = dayjs();
  const words: Record<string, number> = { 前天: -2, 昨天: -1, 今天: 0, 明天: 1 };
  for (const [word, offset] of Object.entries(words)) {
    if (text.includes(word)) {
      return today.add(offset, 'day').format('YYYY-MM-DD');
    }
  }
  const m = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (m) {
    return `${today.year()}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  }
  return undefined;
}

/**
 * 解析记账文本
 * @returns 解析结果；无法提取金额时返回 null
 */
export function parseBillText(text: string, categories: CategoryWithSubs[]): ParsedBill | null {
  const raw = text.trim();
  if (!raw) return null;

  // 1. 金额：取最后一个数字
  const amountMatches = raw.match(/\d+(?:\.\d{1,2})?/g);
  if (!amountMatches || amountMatches.length === 0) return null;
  const amount = parseFloat(amountMatches[amountMatches.length - 1]);
  if (!amount || amount <= 0 || amount > 99999999) return null;

  // 2. 类型与分类
  const type = detectType(raw);
  const rules = type === 'income' ? INCOME_RULES : EXPENSE_RULES;
  const lower = raw.toLowerCase();
  let matched: CategoryRule | undefined;
  let matchedKeyword: string | undefined;
  for (const rule of rules) {
    const kw = rule.keywords.find((k) => lower.includes(k.toLowerCase()));
    if (kw) {
      matched = rule;
      matchedKeyword = kw;
      break;
    }
  }

  const kindCats = categories.filter((c) => c.kind === type);
  const category = matched ? kindCats.find((c) => c.code === matched!.code) : undefined;
  let subCategoryId: number | undefined;
  if (matched?.subs && category) {
    const subRule = matched.subs.find((s) => s.keywords.some((k) => lower.includes(k.toLowerCase())));
    if (subRule) {
      subCategoryId = category.subs.find((s) => s.name === subRule.name)?.id;
    }
  }

  // 3. 日期
  const date = parseDate(raw);

  // 4. 备注：去掉数字、日期词和命中的关键词
  const NOISE_WORDS = ['中午', '早上', '晚上', '下午', '上午', '傍晚', '凌晨', '周末', '今天', '明天', '昨天', '前天'];
  let note = raw
    .replace(/\d+(?:\.\d{1,2})?\s*[元块¥￥]?/g, ' ')
    .replace(new RegExp(NOISE_WORDS.join('|'), 'g'), ' ');
  if (matchedKeyword) note = note.replace(new RegExp(matchedKeyword, 'g'), ' ');
  if (matched?.subs) {
    for (const s of matched.subs) {
      for (const k of s.keywords) note = note.replace(new RegExp(k, 'g'), ' ');
    }
  }
  note = note.replace(/\s+/g, ' ').trim();

  return {
    amount,
    type,
    categoryId: category?.id,
    subCategoryId,
    date,
    note: note || undefined,
    confidence: matched ? 'high' : 'medium',
  };
}
