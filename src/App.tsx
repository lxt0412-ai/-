import { Activity, Bot, ClipboardList, FileHeart, ShieldCheck, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PatientProfileForm } from './components/PatientProfileForm';
import { DailyRecordForm } from './components/DailyRecordForm';
import { WorkflowPanel } from './components/WorkflowPanel';
import { PatientResultCard } from './components/PatientResultCard';
import { ReviewDesk } from './components/ReviewDesk';
import { defaultProfile, defaultRecord, seedReviewCase } from './data/defaults';
import { demoExamples } from './data/examples';
import type { DailyRecord, GlucoseAnalysisResult, PatientProfile, ReviewCase, WorkflowNode } from './types';
import { analyzeRecord, buildWorkflow, createInitialWorkflow, createReviewCase, finalStatusForNode, workflowLabels } from './utils/analysis';
import { readStorage, writeStorage } from './utils/storage';

const tabs = [
  { id: 'profile', label: '患者建档', icon: FileHeart },
  { id: 'record', label: '日常记录', icon: ClipboardList },
  { id: 'workflow', label: 'AI 工作流', icon: Bot },
  { id: 'result', label: '患者结果', icon: Activity },
  { id: 'review', label: '专业审核台', icon: Stethoscope },
] as const;

type TabId = (typeof tabs)[number]['id'];

const valueCards = [
  ['患者建档', '结合疾病类型、地区、年龄、病史建立个体化上下文'],
  ['多模态日常记录', '血糖、饮食、运动、症状共同参与分析'],
  ['AI 工作流', '数据解析、知识库检索、风险分层、建议生成、安全审核'],
  ['医疗安全闭环', '高风险不直出，进入医生/健康管理师确认流程'],
] as const;

const architectureSteps = [
  '患者输入',
  '患者档案 + 日常记录',
  '数据解析',
  '知识库检索',
  '规则风险分层',
  '个性化建议生成',
  '安全审核',
  '低中风险：患者端卡片 / 高风险：医生审核台',
  '确认版建议 / 线下就医提醒 / 电话随访',
] as const;

const responsibilityColumns = [
  ['AI 负责', ['自然语言输入解析', '血糖异常解释', '饮食建议表达生成', '运动建议表达生成', '患者友好话术']],
  ['规则负责', ['血糖阈值判断', '高风险识别', '特殊人群上调风险', '药物相关风险识别', '是否进入人工确认']],
  ['人工负责', ['高风险结果确认', '建议修改', '线下就医提醒', '电话随访', '医疗责任闭环']],
] as const;

const safetyBoundaries = ['不做诊断', '不直接调整药量', '不替代医生', '高风险不直出', '建议必须经过安全审核', '所有高风险案例进入人工确认', '记录关键审计信息'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState(() => readStorage<PatientProfile>('glucose.profile', defaultProfile));
  const [record, setRecord] = useState(() => readStorage<DailyRecord>('glucose.record', defaultRecord));
  const [reviewCases, setReviewCases] = useState(() => normalizeReviewCases(readStorage<ReviewCase[]>('glucose.reviewCases', [seedReviewCase])));
  const [analysisResult, setAnalysisResult] = useState<GlucoseAnalysisResult | null>(() => readStorage<GlucoseAnalysisResult | null>('glucose.analysisResult', null));
  const [workflow, setWorkflow] = useState<WorkflowNode[]>(() => readStorage<WorkflowNode[]>('glucose.workflow', createInitialWorkflow()));
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const previewResult = useMemo(() => analyzeRecord(profile, record), [profile, record]);
  const result = analysisResult ?? previewResult;

  useEffect(() => writeStorage('glucose.profile', profile), [profile]);
  useEffect(() => writeStorage('glucose.record', record), [record]);
  useEffect(() => writeStorage('glucose.reviewCases', reviewCases), [reviewCases]);
  useEffect(() => writeStorage('glucose.analysisResult', analysisResult), [analysisResult]);
  useEffect(() => writeStorage('glucose.workflow', workflow), [workflow]);

  const runAnalysis = async (inputProfile = profile, inputRecord = record) => {
    if (isAnalyzing) return;
    setActiveTab('workflow');
    setIsAnalyzing(true);
    setAnalysisResult(null);

    let nextResult = analyzeRecord(inputProfile, inputRecord);
    let nextWorkflow = createInitialWorkflow();
    setWorkflow(nextWorkflow);

    for (const [id] of workflowLabels) {
      nextWorkflow = nextWorkflow.map((node) => (node.id === id ? { ...node, status: '运行中' } : node));
      setWorkflow(nextWorkflow);
      await delay(320);

      nextWorkflow = nextWorkflow.map((node) => (
        node.id === id ? { ...node, status: finalStatusForNode(id, nextResult) } : node
      ));
      setWorkflow(nextWorkflow);
      await delay(160);
    }

    if (nextResult.destination === 'review') {
      const reviewTask = createReviewCase(inputProfile, inputRecord, nextResult);
      nextResult = { ...nextResult, reviewCaseId: reviewTask.case_id };
      reviewTask.analysis_result = nextResult;
      setReviewCases((cases) => [reviewTask, ...cases.filter((item) => item.case_id !== reviewTask.case_id)]);
    }

    setAnalysisResult(nextResult);
    setWorkflow(buildWorkflow(nextResult));
    setIsAnalyzing(false);
  };

  const queueCurrentCase = () => {
    if (isAnalyzing) return;
    if (result.destination !== 'review') {
      setActiveTab('result');
      return;
    }
    if (!result.reviewCaseId) {
      const nextCase = createReviewCase(profile, record, result);
      setReviewCases((cases) => [nextCase, ...cases]);
      setAnalysisResult({ ...result, reviewCaseId: nextCase.case_id });
    }
    setActiveTab('review');
  };

  const applyExample = (exampleId: string) => {
    const example = demoExamples.find((item) => item.id === exampleId);
    if (!example || isAnalyzing) return;
    setProfile(example.profile);
    setRecord(example.record);
    setAnalysisResult(null);
    setWorkflow(createInitialWorkflow());
    void runAnalysis(example.profile, example.record);
  };

  const currentReviewTask = result.reviewCaseId
    ? reviewCases.find((item) => item.case_id === result.reviewCaseId)
    : reviewCases.find((item) => item.patient_id === profile.patientId && ['approved', 'modified', 'escalated'].includes(item.status));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="eyebrow">AI Product Demo</p>
            <h1>AI 血糖健康管理助手</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="主模块">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="safety-panel">
          <p className="eyebrow">医疗安全边界</p>
          <strong>高风险不直出完整建议</strong>
          <span>特殊人群、急症信号和极端血糖进入医生/健康管理师确认闭环。</span>
        </div>
      </aside>

      <main className="main-content">
        <section className="hero-band">
          <div>
            <p className="eyebrow">Portfolio Product Demo</p>
            <h2>AI 血糖健康管理助手 Demo</h2>
            <p>
              面向糖尿病/CGM 场景的血糖异常解释、风险分层、个性化建议与医生确认闭环。
            </p>
          </div>
          <div className={`risk-summary ${result.riskLevel}`}>
            <span>当前模拟风险</span>
            <strong>{riskText(result.riskLevel)}</strong>
            <small>{record.measurementScene} · {result.normalizedGlucose} mmol/L</small>
          </div>
        </section>

        <section className="portfolio-section">
          <div className="section-heading">
            <p className="eyebrow">Product Value</p>
            <h2>面向 AI 产品经理作品集的核心价值</h2>
          </div>
          <div className="value-grid">
            {valueCards.map(([title, description], index) => (
              <article className="value-card" key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolio-section">
          <div className="section-heading">
            <p className="eyebrow">Product Architecture</p>
            <h2>产品架构说明</h2>
          </div>
          <div className="architecture-flow">
            {architectureSteps.map((step, index) => (
              <div className="flow-step" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="portfolio-section split-overview">
          <div>
            <div className="section-heading">
              <p className="eyebrow">AI + Rules + Human</p>
              <h2>AI 与规则的分工说明</h2>
            </div>
            <div className="responsibility-grid">
              {responsibilityColumns.map(([title, items]) => (
                <article className="responsibility-card" key={title}>
                  <h3>{title}</h3>
                  <ul>
                    {items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
          <aside className="safety-boundary-card">
            <p className="eyebrow">Safety Boundary</p>
            <h2>安全边界说明</h2>
            <div className="boundary-list">
              {safetyBoundaries.map((item) => <span key={item}>{item}</span>)}
            </div>
          </aside>
        </section>

        <section className="example-strip" aria-label="演示示例">
          <div>
            <p className="eyebrow">Interview Demo Shortcuts</p>
            <h3>一键运行 4 个典型场景</h3>
          </div>
          <div className="example-buttons">
            {demoExamples.map((example) => (
              <button type="button" key={example.id} onClick={() => applyExample(example.id)}>
                <strong>{example.title}</strong>
                <span>{example.expected}</span>
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'profile' && <PatientProfileForm profile={profile} onChange={setProfile} onNext={() => setActiveTab('record')} />}
        {activeTab === 'record' && <DailyRecordForm record={record} onChange={setRecord} onAnalyze={runAnalysis} />}
        {activeTab === 'workflow' && <WorkflowPanel nodes={workflow} result={result} isAnalyzing={isAnalyzing} hasAnalysis={Boolean(analysisResult)} onStart={runAnalysis} onRoute={queueCurrentCase} />}
        {activeTab === 'result' && <PatientResultCard profile={profile} record={record} result={result} reviewTask={currentReviewTask} />}
        {activeTab === 'review' && <ReviewDesk cases={reviewCases} onChange={setReviewCases} />}
      </main>
    </div>
  );
}

function riskText(level: string) {
  return level === 'normal' ? '正常' : level === 'low' ? '低风险' : level === 'medium' ? '中风险' : '高风险';
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeReviewCases(cases: ReviewCase[]): ReviewCase[] {
  return cases
    .map((item) => {
      if ('case_id' in item) return item;
      const legacy = item as unknown as {
        caseId?: string;
        patientSummary?: string;
        recordSummary?: string;
        riskLevel?: ReviewCase['risk_level'];
        triggers?: string[];
        evidence?: string[];
        draftAdvice?: string;
      };
      return {
        case_id: legacy.caseId ?? `CASE-${Date.now()}`,
        patient_id: defaultProfile.patientId,
        patient_summary: legacy.patientSummary ?? '旧版审核任务',
        daily_record_summary: legacy.recordSummary ?? '旧版记录摘要',
        risk_level: legacy.riskLevel ?? 'high',
        risk_reason: legacy.triggers ?? ['旧版任务迁移'],
        knowledge_evidence: legacy.evidence ?? [],
        ai_draft: legacy.draftAdvice ?? '',
        safety_audit_result: { passed: true, issues: [], blockedPatientOutput: true },
        status: 'pending',
        created_at: new Date().toISOString(),
        reviewer_note: legacy.draftAdvice ?? '',
        patient_profile: defaultProfile,
        daily_record: defaultRecord,
        analysis_result: analyzeRecord(defaultProfile, defaultRecord),
      };
    });
}

export default App;
