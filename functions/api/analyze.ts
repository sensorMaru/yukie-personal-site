import { Buffer } from 'node:buffer';

type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<any>;
};

type Env = {
  AI: AiBinding;
};

type Target = {
  id?: string;
  source?: string;
  replacement?: string;
  count?: number;
};

type Check = {
  id: string;
  kind?: string;
  source: string;
  replacement: string;
  status: 'pass' | 'review' | 'warning';
  detail: string;
  start?: number;
  end?: number;
};

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MODEL = '@cf/openai/whisper-large-v3-turbo';

const CHARACTER_VARIANTS: Record<string, string> = {
  '臺': '台', '裡': '里', '裏': '里', '準': '准', '備': '备', '電': '电', '視': '视',
  '還': '还', '這': '这', '過': '过', '擺': '摆', '轉': '转', '體': '体', '畫': '画',
  '態': '态', '氣': '气', '機': '机', '與': '与', '為': '为', '來': '来', '開': '开',
  '關': '关', '係': '系', '測': '测', '數': '数', '據': '据', '時': '时', '間': '间',
  '聲': '声', '學': '学', '詞': '词', '讀': '读', '實': '实', '際': '际', '聽': '听',
  '錯': '错', '誤': '误', '發': '发', '現': '现', '較': '较', '約': '约', '個': '个',
  '種': '种', '壓': '压', '縮': '缩', '顯': '显', '選': '选', '擇': '择', '應': '应',
  '該': '该', '讓': '让', '認': '认', '識': '识', '輸': '输', '處': '处', '斷': '断',
  '續': '续', '將': '将', '從': '从', '對': '对', '並': '并', '後': '后', '萬': '万',
};

const json = (payload: unknown, status = 200) => Response.json(payload, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

const normalizeText = (value: string) => [...value.normalize('NFKC')]
  .map(character => CHARACTER_VARIANTS[character] || character)
  .join('')
  .replace(/[^0-9A-Za-z\u3400-\u9fff]/g, '')
  .toUpperCase();

const cleanTranscript = (value: string) => value
  .normalize('NFKC')
  .replace(/\s+/g, '')
  .replace(/，{2,}/g, '，')
  .trim();

const lcsTable = (left: string, right: string) => {
  const table = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
};

const locateSegment = (segments: any[], heardChunk: string) => {
  const target = normalizeText(heardChunk);
  if (!target || !Array.isArray(segments)) return null;
  for (const segment of segments) {
    const text = normalizeText(String(segment?.text || segment?.word || ''));
    if (!text.includes(target)) continue;
    const start = Number(segment?.start);
    const end = Number(segment?.end);
    if (Number.isFinite(start)) return {
      start: Math.max(0, Math.round(start * 100) / 100),
      end: Number.isFinite(end) ? Math.round(end * 100) / 100 : Math.round((start + 1.2) * 100) / 100,
    };
  }
  return null;
};

const compareText = (expected: string, transcript: string, segments: any[]) => {
  const left = normalizeText(expected);
  const right = normalizeText(transcript);
  if (!left || !right) return { similarity: 0, mismatches: [] as Check[] };

  const table = lcsTable(left, right);
  const similarity = Math.round((2 * table[0][0] / (left.length + right.length)) * 100);
  const operations: Array<{ type: 'equal' | 'delete' | 'insert'; value: string }> = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) {
      operations.push({ type: 'equal', value: left[i] });
      i += 1;
      j += 1;
    } else if (j >= right.length || (i < left.length && table[i + 1][j] >= table[i][j + 1])) {
      operations.push({ type: 'delete', value: left[i] });
      i += 1;
    } else {
      operations.push({ type: 'insert', value: right[j] });
      j += 1;
    }
  }

  const mismatches: Check[] = [];
  for (let index = 0; index < operations.length && mismatches.length < 8;) {
    if (operations[index].type === 'equal') {
      index += 1;
      continue;
    }
    const startIndex = index;
    let source = '';
    let heard = '';
    while (index < operations.length && operations[index].type !== 'equal') {
      if (operations[index].type === 'delete') source += operations[index].value;
      if (operations[index].type === 'insert') heard += operations[index].value;
      index += 1;
    }
    const previous = operations.slice(Math.max(0, startIndex - 2), startIndex)
      .filter(operation => operation.type === 'equal').map(operation => operation.value).join('');
    const following = operations.slice(index, index + 2)
      .filter(operation => operation.type === 'equal').map(operation => operation.value).join('');
    const timing = locateSegment(segments, heard);
    const kind = source && heard ? 'replace' : source ? 'delete' : 'insert';
    const sourceLabel = source || '原稿无';
    const heardLabel = heard || '未读出';
    const context = `${previous}${source || heard}${following}`;
    mismatches.push({
      id: `content-${mismatches.length + 1}`,
      kind: 'content-mismatch',
      source: sourceLabel,
      replacement: heardLabel,
      status: kind === 'insert' ? 'review' : 'warning',
      detail: kind === 'replace'
        ? `原稿“${context}”中的“${source}”，实际转写为“${heard}”，请复听确认是否错读。`
        : kind === 'delete'
          ? `原稿“${context}”中的“${source}”没有稳定识别到，可能存在漏读。`
          : `音频中多识别到“${heard}”，原稿没有对应内容，请复听确认。`,
      ...(timing || {}),
    });
  }

  return { similarity, mismatches };
};

const compareTargets = (transcript: string, targets: Target[]): Check[] => {
  const heard = normalizeText(transcript);
  return targets.slice(0, 30).map((target, index) => {
    const id = String(target.id || `target-${index + 1}`);
    const source = String(target.source || '目标词');
    const replacement = String(target.replacement || '').trim();
    const expected = normalizeText(replacement);
    const count = Math.max(1, Number(target.count) || 1);
    const heardCount = expected ? heard.split(expected).length - 1 : 0;
    let status: Check['status'] = heardCount >= count ? 'pass' : 'warning';
    let detail = status === 'pass'
      ? `已在实际语音中识别到“${replacement}”${heardCount}次。`
      : `预期听到“${replacement}”${count}次，当前只识别到${heardCount}次。`;

    if (id === 'letters-ai') {
      status = heard.includes('AI') ? 'review' : 'warning';
      detail = status === 'review'
        ? '识别到了 AI，但转写无法完全证明 A、I 是否逐字母读出，建议复听。'
        : '没有识别到 AI，请检查是否被读成单个汉字音。';
    } else if (id === 'people-conjunction' && heardCount < count) {
      const sourceCount = heard.split(normalizeText(source)).length - 1;
      status = sourceCount ? 'review' : 'warning';
      detail = sourceCount
        ? '模型仍转写成“和”，语义自动纠正可能掩盖 hàn／hé 差异，请人工复听。'
        : detail;
    }

    return { id, source, replacement, status, detail };
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    if (!context.env.AI) return json({ error: 'ai_binding_missing' }, 503);
    const url = new URL(context.request.url);
    const size = Number(context.request.headers.get('Content-Length') || 0);
    if (size > MAX_AUDIO_BYTES) return json({ error: 'audio_too_large' }, 413);

    const expected = (url.searchParams.get('expected') || '').slice(0, 1200);
    const duration = Math.max(0, Number(url.searchParams.get('duration') || 0));
    let targets: Target[] = [];
    try {
      const parsed = JSON.parse((url.searchParams.get('targets') || '[]').slice(0, 8000));
      if (Array.isArray(parsed)) targets = parsed;
    } catch {
      targets = [];
    }

    const audioBuffer = await context.request.arrayBuffer();
    if (!audioBuffer.byteLength || audioBuffer.byteLength > MAX_AUDIO_BYTES) {
      return json({ error: 'invalid_audio_size' }, 400);
    }

    const audio = Buffer.from(audioBuffer).toString('base64');
    const result = await context.env.AI.run(MODEL, {
      audio,
      task: 'transcribe',
      language: 'zh',
      vad_filter: true,
      beam_size: 5,
      condition_on_previous_text: false,
      initial_prompt: '请使用繁体中文逐字记录实际听到的发音，不要按照语意自动纠正近音字。若听到“准比”就写“准比”，听到“姿色”就写“姿色”；数字记录实际念法，英文字母分开辨识。',
    });

    const transcript = cleanTranscript(String(result?.text || result?.transcription_info?.text || ''));
    const segments = Array.isArray(result?.segments)
      ? result.segments
      : Array.isArray(result?.transcription_info?.segments) ? result.transcription_info.segments : [];
    const { similarity, mismatches } = expected.trim()
      ? compareText(expected, transcript, segments)
      : { similarity: transcript ? 100 : 0, mismatches: [] as Check[] };
    const targetChecks = expected.trim() ? compareTargets(transcript, targets) : [];
    const checks = [...mismatches, ...targetChecks];
    const warningCount = checks.filter(check => check.status === 'warning').length;
    const reviewCount = checks.filter(check => check.status === 'review').length;
    const referenceMode = expected.trim() ? 'script' : 'transcript';
    const quality = !transcript
      ? { status: 'insufficient', label: '无法可靠判断', detail: '没有识别到稳定语音，请检查音量或文件格式。' }
      : referenceMode === 'script' && (warningCount || reviewCount)
        ? { status: 'review', label: `发现 ${warningCount + reviewCount} 处需确认`, detail: '已把实际转写与本次原稿逐字比对，请复听标记位置。' }
        : referenceMode === 'script' && similarity < 92
          ? { status: 'review', label: '建议复听', detail: '音频与原稿基本对应，但匹配度不足以直接判定通过。' }
          : { status: 'high', label: '音频检查通过', detail: referenceMode === 'script' ? '未发现明显错读、漏读或多读。' : '未发现明显发音问题；未提供原稿，因此不判断漏读。' };

    return json({
      duration: duration ? Math.round(duration * 10) / 10 : '—',
      transcript,
      similarity,
      referenceMode,
      recognitionConfidence: transcript ? 85 : 0,
      model: 'cloudflare-whisper-large-v3-turbo',
      quality,
      checks,
      contentMismatches: mismatches,
      acoustic: [],
      acousticSummary: { pass: 0, review: reviewCount, warning: warningCount },
      notice: '音频由云端 Whisper 逐字转写后与本次原稿比对；未提供原稿时不判断漏读。自动结果用于初检，标记项仍建议复听。',
    });
  } catch (error) {
    return json({
      error: 'analysis_failed',
      detail: error instanceof Error ? error.message : 'unknown_error',
    }, 500);
  }
};

