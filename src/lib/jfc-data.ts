export const JFC_SOURCE_NAME = "日本政策金融公庫";

export interface JFCLoanProgram {
    id: string;
    name: string;
    segment: '国民生活' | '中小企業' | '農林水産';
    businessTypeTags: string[];
    themeTags: string[];
    summary: string;
    referenceUrl: string;
}

export const JFC_BUSINESS_TYPES = [
    { id: 'hygiene', label: '生活衛生関係営業' },
    { id: 'service', label: 'サービス、卸・小売業' },
    { id: 'other', label: 'その他の業種' },
];

export const JFC_THEMES = [
    { id: 'startup', label: '創業・創業後間もない方' },
    { id: 'new_biz', label: '新事業・多角化' },
    { id: 'expansion', label: '事業拡大・生産性向上' },
    { id: 'succession', label: '事業承継・M&A' },
    { id: 'social', label: 'ソーシャルビジネス' },
    { id: 'overseas', label: '海外展開・事業再編' },
    { id: 'sdgs', label: 'SDGs' },
    { id: 'environment', label: '環境対策' },
    { id: 'safetynet', label: 'セーフティネット' },
    { id: 'reconstruction', label: '事業再建・企業再生' },
    { id: 'capital', label: '財務体質の強化（資本性ローン）' },
    { id: 'disaster', label: '災害関係（BCP含む）' },
    { id: 'guidance', label: '商工会・商工会議所・生活衛生同業組合等の経営指導を受けている方' },
    { id: 'other_purpose', label: 'その他のお使いみち' },
    { id: 'special', label: '併用できる特例制度等' },
];

export const JFC_LOAN_PROGRAMS: JFCLoanProgram[] = [
    {
        id: 'startup_fund',
        name: '新規開業・スタートアップ支援資金',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['startup'],
        summary: '新たに事業を始める方や事業開始後間もない方向けの融資制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/new_business.html',
    },
    {
        id: 'safety_net_fund',
        name: 'セーフティネット貸付',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['safetynet', 'disaster'],
        summary: '社会的、経済的環境の変化などにより、一時的に売上が減少している方向けの制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/saftynet.html',
    },
    {
        id: 'hygiene_general',
        name: '生活衛生貸付（一般貸付）',
        segment: '国民生活',
        businessTypeTags: ['hygiene'],
        themeTags: ['other_purpose'],
        summary: '飲食店や喫茶店、理容店、美容店など生活衛生関係の営業を営む方向けの制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/seikatsu_ippan.html',
    },
    {
        id: 'hygiene_promotion',
        name: '振興事業貸付',
        segment: '国民生活',
        businessTypeTags: ['hygiene'],
        themeTags: ['guidance', 'expansion'],
        summary: '生活衛生同業組合の組合員の方が、振興計画に基づいて事業を行う場合の制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/seikatsu_shinko.html',
    },
    {
        id: 'capital_loan',
        name: '挑戦支援資本強化特別貸付（資本性ローン）',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['capital', 'startup', 'new_biz'],
        summary: '自己資本を補完し、財務体質を強化するための制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/shihonsei.html',
    },
    {
        id: 'social_biz',
        name: 'ソーシャルビジネス支援資金',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['social'],
        summary: 'NPO法人や社会的課題の解決を目的とする事業を営む方向けの制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/social.html',
    },
    {
        id: 'succession_fund',
        name: '事業承継・集約・活性化支援資金',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['succession'],
        summary: '事業の継承や集約、活性化を図る方向けの制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/shokei.html',
    },
    {
        id: 'reconstruction_fund',
        name: '企業再建資金',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['reconstruction'],
        summary: '法的整理によらずに事業の再建を図る方向けの制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/saiken.html',
    },
    {
        id: 'overseas_fund',
        name: '海外展開・事業再編資金',
        segment: '国民生活',
        businessTypeTags: ['hygiene', 'service', 'other'],
        themeTags: ['overseas'],
        summary: '海外展開や事業の再編を行う方向けの制度です。',
        referenceUrl: 'https://www.jfc.go.jp/n/service/kaigai.html',
    },
];

export interface JFCDocTemplate {
    id: string;
    category: string;
    type: 'required' | 'reference';
    requiredCount: number;
    downloadUrl?: string;
    excelUrl?: string;
}

export const JFC_DOC_TEMPLATES: Record<string, JFCDocTemplate> = {
    startup_plan: {
        id: 'startup_plan',
        category: '創業計画書',
        type: 'required',
        requiredCount: 1,
        downloadUrl: 'https://www.jfc.go.jp/n/service/pdf/kaigyou00_190507b.pdf',
        excelUrl: 'https://www.jfc.go.jp/n/service/xls/kaigyou00_190507a.xlsx',
    },
    business_summary: {
        id: 'business_summary',
        category: '企業概要書',
        type: 'required',
        requiredCount: 1,
        downloadUrl: 'https://www.jfc.go.jp/n/service/pdf/kigyou_gaiyousyo190507m.pdf',
        excelUrl: 'https://www.jfc.go.jp/n/service/xls/kigyou_gaiyousyo190507l.xlsx',
    },
    tax_return: {
        id: 'tax_return',
        category: '確定申告書',
        type: 'required',
        requiredCount: 2,
    },
    financial_statement: {
        id: 'financial_statement',
        category: '決算書',
        type: 'required',
        requiredCount: 2,
    },
    id_card: {
        id: 'id_card',
        category: '本人確認書類',
        type: 'required',
        requiredCount: 1,
    },
    bank_passbook: {
        id: 'bank_passbook',
        category: '送金先口座の確認資料',
        type: 'required',
        requiredCount: 1,
    },
    estimate: {
        id: 'estimate',
        category: '見積書',
        type: 'required',
        requiredCount: 0, // conditionally required
    },
    trial_balance: {
        id: 'trial_balance',
        category: '試算表',
        type: 'required',
        requiredCount: 1,
    },
    license: {
        id: 'license',
        category: '許認可証',
        type: 'required',
        requiredCount: 1,
    },
    account_details: {
        id: 'account_details',
        category: '勘定科目明細',
        type: 'required',
        requiredCount: 1,
    },
    cash_flow: {
        id: 'cash_flow',
        category: '資金繰り表',
        type: 'reference',
        requiredCount: 0,
        downloadUrl: 'https://www.jfc.go.jp/n/service/zip/sikinguri_181120.zip',
    },
    recommendation: {
        id: 'recommendation',
        category: '都道府県知事の推せん書',
        type: 'required',
        requiredCount: 1,
        downloadUrl: 'https://www.jfc.go.jp/n/service/pdf/suisen_240401.pdf',
    },
    fund_cert: {
        id: 'fund_cert',
        category: '振興事業に係る資金証明書',
        type: 'required',
        requiredCount: 1,
    },
    biz_plan_mid: {
        id: 'biz_plan_mid',
        category: '事業計画書（中期）',
        type: 'required',
        requiredCount: 1,
    },
    reconstruction_plan: {
        id: 'reconstruction_plan',
        category: '経営改善計画（再建用）',
        type: 'required',
        requiredCount: 1,
    },
    overseas_plan: {
        id: 'overseas_plan',
        category: '海外展開事業計画書',
        type: 'required',
        requiredCount: 1,
    },
    revenue_plan: {
        id: 'revenue_plan',
        category: '月別収支計画書',
        type: 'required',
        requiredCount: 1,
        excelUrl: 'https://www.jfc.go.jp/n/service/xls/tukibetu_syuusikeikakusyo191120.xlsx',
    },
    borrowing_application: {
        id: 'borrowing_application',
        category: '借入申込書',
        type: 'required',
        requiredCount: 1,
        downloadUrl: 'https://www.jfc.go.jp/n/service/pdf/mousikomi190701_dl.pdf',
    },
    equipment_investment_plan: {
        id: 'equipment_investment_plan',
        category: '設備投資計画書',
        type: 'required',
        requiredCount: 1,
        excelUrl: 'https://www.jfc.go.jp/n/service/xls/setsubi_tousikeikakusyo190507.xlsx',
    },
    startup_special_plan: {
        id: 'startup_special_plan',
        category: '創業特例・雇用拡大計画書',
        type: 'reference',
        requiredCount: 1,
        downloadUrl: 'https://www.jfc.go.jp/n/service/pdf/sougyoutokurei_koyou_220401a.pdf',
    },
    employment_maintenance_plan: {
        id: 'employment_maintenance_plan',
        category: '雇用維持・拡大計画書',
        type: 'reference',
        requiredCount: 1,
        downloadUrl: 'https://www.jfc.go.jp/n/service/pdf/koyouiji_220401a.pdf',
    },
};

export const JFC_LOAN_DOC_MAPPING: Record<string, string[]> = {
    startup_fund: ['borrowing_application', 'startup_plan', 'tax_return', 'id_card', 'bank_passbook', 'estimate', 'revenue_plan', 'cash_flow'],
    safety_net_fund: ['borrowing_application', 'business_summary', 'tax_return', 'financial_statement', 'trial_balance', 'cash_flow'],
    hygiene_general: ['borrowing_application', 'business_summary', 'tax_return', 'financial_statement', 'license', 'recommendation'],
    hygiene_promotion: ['borrowing_application', 'business_summary', 'tax_return', 'financial_statement', 'license', 'fund_cert'],
    capital_loan: ['borrowing_application', 'biz_plan_mid', 'tax_return', 'financial_statement', 'trial_balance', 'cash_flow'],
    social_biz: ['borrowing_application', 'business_summary', 'tax_return', 'financial_statement', 'id_card'],
    succession_fund: ['borrowing_application', 'business_summary', 'tax_return', 'financial_statement'],
    reconstruction_fund: ['borrowing_application', 'reconstruction_plan', 'tax_return', 'financial_statement', 'trial_balance', 'cash_flow'],
    overseas_fund: ['borrowing_application', 'overseas_plan', 'tax_return', 'financial_statement', 'bank_passbook'],
};
