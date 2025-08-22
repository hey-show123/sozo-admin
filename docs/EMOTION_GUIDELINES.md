# 感情表現ガイドライン - TTS音声生成

このドキュメントでは、OpenAI GPT-4o-mini-TTSモデルで使用する感情表現の記述方法について説明します。

## 基本的な使い方

感情フィールドには、話者の感情や話し方を表す英語の形容詞や短いフレーズを入力してください。

例:
- `friendly` - 親しみやすい口調
- `professional and clear` - プロフェッショナルで明瞭な話し方
- `excited and energetic` - 興奮してエネルギッシュな話し方

## よく使用される感情表現

### 基本的な感情
- `friendly` - 親しみやすい、フレンドリー
- `polite` - 丁寧、礼儀正しい
- `happy` - 幸せ、楽しい
- `excited` - 興奮した、わくわくした
- `calm` - 落ち着いた、穏やか
- `neutral` - 中立的、感情を抑えた
- `sad` - 悲しい
- `angry` - 怒った
- `surprised` - 驚いた
- `worried` - 心配した

### ビジネス・教育場面
- `professional` - プロフェッショナル
- `encouraging` - 励ます、勇気づける
- `supportive` - サポート的、支援的
- `patient` - 忍耐強い
- `enthusiastic` - 熱心な
- `confident` - 自信のある
- `apologetic` - 申し訳なさそうな
- `formal` - フォーマル、堅い
- `casual` - カジュアル、くだけた

### 複合的な表現
- `warm and friendly` - 温かく親しみやすい
- `polite and professional` - 丁寧でプロフェッショナル
- `cheerful and upbeat` - 明るく前向き
- `calm and relaxed` - 落ち着いてリラックスした
- `curious and interested` - 好奇心旺盛で興味深そう
- `sympathetic and caring` - 同情的で思いやりのある
- `grateful and thankful` - 感謝に満ちた
- `confused and puzzled` - 困惑した

## 詳細な指示の例

より具体的な指示を与えることも可能です:

- `speak like a friendly customer service agent` - フレンドリーなカスタマーサービススタッフのように
- `gentle and reassuring tone` - 優しく安心させるような口調
- `speak with slight nervousness` - 少し緊張した様子で
- `enthusiastic teacher explaining a concept` - 概念を説明する熱心な教師のように
- `tired but trying to be helpful` - 疲れているが助けようとしている

## ベストプラクティス

1. **シンプルで明確に**: 基本的には単純な形容詞1-2個で十分です
2. **文脈に合わせる**: ダイアログの内容や状況に適した感情を選択
3. **一貫性を保つ**: 同じキャラクターは似た感情トーンを維持
4. **自然な変化**: 会話の流れに応じて感情を変化させる

## 注意事項

- 空欄または `neutral` の場合、標準的な読み上げになります
- 英語で記述してください（日本語は認識されません）
- 過度に複雑な指示は期待通りに動作しない場合があります

## 例: レッスンでの使用

```
Staff: "Welcome to our salon!" → emotion: "warm and friendly"
Customer: "I have an appointment." → emotion: "polite"
Staff: "Perfect! Right this way." → emotion: "cheerful and professional"
Customer: "Thank you." → emotion: "grateful"
```

## トラブルシューティング

感情が反映されない場合:
1. 英語で記述されているか確認
2. スペルミスがないか確認
3. シンプルな表現に変更してみる
4. モデルが `gpt-4o-mini-tts` になっているか確認