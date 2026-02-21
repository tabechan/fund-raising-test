# DESIGN_GUIDE.md
融資支援AI（仮）のUI/UXデザインガイド（Blueprint Grayscale Style）

> 目的：**「不安を減らす」「次に何をすれば良いかが一瞬で分かる」** を最優先にした、静かで信頼感のあるUI。  
> 本ガイドは、指定のスタイル（高コントラストのグレースケール＋ブループリント幾何学）に準拠します。

---

# Style

The style is defined by its Monospace typography (JetBrains Mono), high-contrast grayscale palette, and geometric 'blueprint' aesthetic. It uses 1px borders for structure rather than heavy shadows, and employs abstract SVG patterns (grids, circles, paths) with low opacity to create depth. Colors are strictly limited to white (#FFFFFF), light grays (#F3F4F6, #E5E7EB), and deep charcoal/black (#111827).

## Spec

### Typography
- **Primary Font**: 'Kosugi'
https://fonts.google.com/specimen/Kosugi
- **Hierarchy**: 
  - Headings: Bold, #111827, 2xl (24px) for hero titles, xl (20px) for section headers.
  - Metadata/Labels: Uppercase, font-bold, 9px-10px, tracking-widest, color #9CA3AF.
  - Body/UI Text: Medium, 11px-12px, color #111827 or #6B7280.

### Color Palette
- **App Background**: #F3F4F6
- **Surface/Card Background**: #FFFFFF
- **Interactive/Primary**: #111827
- **Borders/Lines**: #E5E7EB
- **Accents/Shapes**: #FAFAFA (for geometric containers)

### Effects & Interactivity
- **Borders**: 1px solid #E5E7EB for all containers and cards.
- **Shadows**: Very subtle (shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)).
- **Hovers**: Transition from #E5E7EB border to #111827 border on 150ms ease-in-out.
- **Transitions**: Smooth scale and color shifts for icons and primary buttons.

### Decoration
- **Geometric Assets**: Use low-opacity (10-30%) SVG patterns (10x10 grids, concentric circles, isometric triangles) in a dark stroke (#111827) against light backgrounds.

---

## 1. レイアウトの基本

### Global
- **App Background**: #F3F4F6
- **Top Tabs**: 文字色 #111827（active）/ #6B7280（inactive）＋下線 1px #E5E7EB

### Checker（2カラム）
- **Left Sidebar**: 書類チェックリスト（必須/参考）
- **Main Pane**: タイトル（Hero 24px）＋説明カード＋テンプレDL＋チャット

---

## 2. コンポーネント規約（実装に直結）

### Cards / Containers
- 背景 #FFFFFF、ボーダー 1px #E5E7EB、角丸 12–16px、影はshadow-smのみ
- 背面にSVGパターン（10–20%）を置いても良い（本文の上には被せない）

### Buttons
- **Primary**: #111827 背景 / #FFFFFF 文字
- **Outline**: #FFFFFF 背景 / 1px #E5E7EB / #111827 文字
- Hover: 150msでボーダーが #111827 へ（PrimaryもOutlineも）
- アイコンはscale 1.00→1.03程度の微変化

### Typography
- Hero: 24px Bold
- Section: 20px Bold
- Label: 9–10px Uppercase + tracking-widest + #9CA3AF
- Body: 11–12px Medium + #111827 / #6B7280

### Status（書類状態）
- OK: ✅ + “OK”
- Needs fix: ⚠️ + “要改善”
- Missing: ❗ + “未提出”
※色に依存せず必ずラベル併記。

### Decorations（SVG）
- Grid / Concentric circles / Isometric triangles / Paths
- Stroke #111827、opacity 0.10–0.30、背景はライト
- 1画面あたり最大2パターン（ノイズ抑制）

---

## 3. 画面別の適用メモ

### Project Page
- Project Cardは1pxボーダーで整列、サムネ枠は#FAFAFA
- メタ情報はLabelスタイルで上段、値はBody

### Document Upload
- Upload Cardグリッド
- “Upload New Document”は点線枠＋SVGアイコン（薄く）

### Document Checker
- 左サイドバー：状態アイコン＋書類名、アクティブは#FAFAFAの面で薄く強調
- 右ペイン：不足/改善はカード内でブロック化

### Review Simulator
- 開始画面：Hero + 説明 + Primary CTA + Outline CTA
- セッション：チャットUI
- 結果：評価を大きく（A等）＋良かった点/改善点をカードで

---

## 4. トークン（例）
- bg: #F3F4F6
- surface: #FFFFFF
- ink: #111827
- line: #E5E7EB
- muted: #6B7280
- label: #9CA3AF
- accentSurface: #FAFAFA
