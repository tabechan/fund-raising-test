"use client";

export interface AIFile {
    data: string; // Base64
    mimeType: string;
}

export async function getAICheckerResponse(
    message: string,
    projectSource: string,
    docCategory: string,
    files?: AIFile[],
    history?: { role: string; text: string }[],
    csvContent?: string,
    projectInfo?: { name: string; amount: string; jfcLoanProgram?: string },
    crossDocContext?: string,
    expertKnowledge?: string
) {
    const historyText = history
        ? history.map(h => `${h.role === 'user' ? 'ユーザー' : 'AI'}: ${h.text}`).join('\n')
        : "";

    const isFirstMessage = !history || history.length === 0;

    const prompt = `
${isFirstMessage ? "あなたは融資審査のアドバイザーです。" : ""}
【解析対象書類】: ${docCategory}
【融資先・プロジェクト情報】
- 融資候補元: ${projectSource}
${projectInfo ? `- プロジェクト名: ${projectInfo.name}\n- 融資希望額: ${projectInfo.amount}\n${projectInfo.jfcLoanProgram ? `- 融資制度: ${projectInfo.jfcLoanProgram}\n` : ""}` : ""}

${crossDocContext ? `【他の書類から得られた情報】\n${crossDocContext}\n` : ""}

${expertKnowledge ? `【専門知識ベース (RAG)】\n${expertKnowledge}\n` : ""}

${csvContent ? `【書類のデータ内容 (CSV形式)】\n${csvContent}\n` : ""}

ユーザーの質問に対して、上記の情報を踏まえて専門的な視点から回答してください。
Excelファイルが添付されている場合、システム側で自動的にPDFに変換し、ファイルとしてAIに提供しています。
これには結合セルやレイアウト情報が含まれているため、それらを正確に読み取って解析してください。
CSV形式の補助データも提供されている場合は、それらも併せて総合的に判断してください。
現在の解析対象は「${docCategory}」ですが、他の書類で判明している売上動向や業種情報なども考慮に入れて回答してください。

報告・改善案の提示ルール:
1. 不備や改善点（入力漏れ、矛盾など）がある場合は、必ず各項目の先頭に「[ACTION] 」というタグを付けて箇条書きで提示してください。
   ※書類の必須項目に空欄がある場合は必ず改善点として指摘してください。
2. すでに十分な内容である場合は「改善点があまりなさそうです」「大丈夫そうです」と明記してください。
3. 未提出または新規ファイルが添付された際、それが「${docCategory}」以外の書類（例: 収支計画書のチャットで確定申告書が送られてきた場合）であると判断できる場合は、以下のように更新を提案してください。
   「この資料は[書類名]として保存しますか？」
   その際、内部タグとして「[SUGGEST_UPDATE: category_id]」を回答の最後（非表示エリアなどの意図ではなく文末）に含めてください。
4. 以前の挨拶などは繰り返さず、シンプルに回答を開始してください。

これまでのやり取り:
${historyText || "（なし）"}

ユーザーの新しいメッセージ: ${message}
  `;

    try {
        const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, files }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.details || "AI response failed");
        }
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        console.error("AI Checker Error:", error);
        return `申し訳ありません。AIとの通信中にエラーが発生しました (${error.message || "Unknown error"})。`;
    }
}

export async function getAISimulatorResponse(
    message: string,
    focus: string,
    projectSource: string,
    documents: any[],
    files?: AIFile[],
    history?: { role: "user" | "ai"; text: string }[],
    expertKnowledge?: string
) {
    const historyText = history
        ? history.map(h => `${h.role === 'user' ? '相談者' : '審査担当者'}: ${h.text}`).join('\n')
        : "";

    const docSummary = documents.map(d => {
        const fileList = d.files.length > 0 ? `(${d.files.map((f: any) => f.name).join(", ")})` : "(未提出)";
        return `- ${d.category}: ${d.status} ${fileList}`;
    }).join("\n");

    const prompt = `
あなたは${projectSource}の融資審査担当者（ベテラン職員）です。
本日は相談者が融資の相談に来られています。

【ミッション】
シミュレーションのフォーカス: ${focus}
提出書類の現状:
${docSummary}

${expertKnowledge ? `【専門知識ベース (RAG)】\n${expertKnowledge}\n` : ""}

【振る舞いのルール】
1. 挨拶と導入:
   開始（__START__）の際は、必ず「本日はお越しいただきありがとうございます」といった丁寧なクッション言葉から冒頭を開始してください。
   その上で、既に提出されている上記書類については「受理した」旨を伝え、未提出の書類については「もし今日お手元にあれば見せていただけますか？」といった形で提出を促し、セッションを開始してください。
2. 質問の質:
   選択されたフォーカス（${focus}）に基づき、重点的に聞いていくポイントを最初に表明してください。
   詰問するのではなく、プロの審査官としての緊張感を持ちつつも適切な質問を行ってください。提供された書類の内容を引用し、矛盾点や改善すべき点を探ってください。
3. 最終評価（ABCD）:
   セッション終了時（ユーザーが終了を求めた場合や審査が一段落した場合）は、以下の基準でABCDの4段階評価とフィードバックを出してください。
   - A: 金融機関が融資を確信する、完璧な準備状況（事業計画の具体性、裏付け資料の完備）。
   - B: 概ね問題ないが、一部に軽微な改善点や確認事項が残る状態。
   - C: 【厳格設定】現状では「否決」または「再提出」となる可能性が高い状態。書類の不足が1項目でもある場合や、回答が抽象的な場合は迷わずC以下としてください。
   - D: 全く準備ができていない、または事業の実現性に致命的な欠陥がある。
   ※チャットのやり取りの中で、最後に「【最終評価: X】」という形式で評価を明記してください。

   さらに、最終評価の際には、以下の形式で詳細レポートを回答の末尾に含めてください。
   [REPORT_START]
   【良かった点】
   - (具体的に)
   【悪かった点（改善すべき点）】
   - (具体的に)
   【書類別フィードバック】
   - (書類名): (具体的なアドバイス)
   【評価項目別フィードバック】
   - (項目名): (具体的なアドバイス)
   [REPORT_END]

4. 会話の自然さとスピード:
   - 2回目以降の回答では、改めての自己紹介や「お越しいただきありがとうございます」といった定型的な挨拶は不要です。文脈に沿って自然に会話を続けてください。
   - 【最重要】一度に質問する内容は「必ず一つだけ」に絞ってください。複数の質問を畳み掛けないでください。
5. 進行状況と終了判定:
   - 会話の最後に、判断の完了に向けた進捗度を「[PROGRESS: 数値]」（0から100の間）の形式で必ず含めてください。
   - 必要な情報が全て揃い、融資の可否や条件についての判断ができる状態になったら、回答の最後に「[FINISH]」というタグを付けて面談を終了させてください。

これまでの面談のやり取り:
${historyText || "（なし）"}

ユーザーのメッセージ: ${message === "__START__" ? "面談を開始してください。" : message}
  `;

    try {
        const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, files }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.details || "AI response failed");
        }
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        console.error("AI Simulator Error:", error);
        return `シミュレーション中にエラーが発生しました (${error.message || "Unknown error"})。しばらく経ってから再度お試しください。`;
    }
}

export function startVoiceRecognition(onResult: (text: string) => void, onEnd: () => void) {
    if (!('webkitSpeechRecognition' in window)) {
        alert("このブラウザは音声認識に対応していません。Chromeなどのブラウザをお試しください。");
        return null;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onResult(text);
    };

    recognition.onend = onEnd;
    recognition.start();
    return recognition;
}

/**
 * Utility to suggest a document category based on file content
 */
export async function suggestDocumentCategory(
    file: AIFile,
    availableCategories: { id: string; name: string }[]
): Promise<string | null> {
    const categoriesText = availableCategories.map(c => `- ${c.id}: ${c.name}`).join("\n");
    const prompt = `
あなたは融資書類の仕分けアシスタントです。
提供された書類の内容を見て、以下のカテゴリ一覧の中から最も適切なものを1つ選んでください。
自信がない場合や、どれにも当てはまらない場合は "other" を返してください。

カテゴリ一覧:
${categoriesText}

回答はカテゴリIDのみを返してください（例: bs）。余計な解説は不要です。
  `;

    try {
        const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, files: [file] }),
        });

        if (!response.ok) return null;
        const data = await response.json();
        const suggestedId = data.text.trim().toLowerCase();

        // Validate that the suggested ID exists in available categories
        if (availableCategories.some(c => c.id === suggestedId) || suggestedId === "other") {
            return suggestedId;
        }
        return null;
    } catch (error) {
        console.error("Category Suggestion Error:", error);
        return null;
    }
}

/**
 * Utility to convert File to Base64
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(",")[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
}
