# 数据规范（.kb.json 条目 Schema v1）

每个批次产出一个 JSON 文件：`src/data/raw/<batch>.json`，内容是**条目对象数组** `Entry[]`。
不要写注释、不要写 Markdown 代码围栏、不要 BOM。必须是合法 JSON（UTF-8）。

## Entry 字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `entry_id` | string | ✓ | 见任务清单给定 id，不得改写 |
| `entry_no` | string | ✓ | `A1`…`C16` |
| `entry_type` | `"place"\|"person"\|"thematic"\|"event"\|"index"\|"route"` | ✓ | 动线条目用 `route` |
| `title` | string | ✓ | 中文正式名，10 字以内为佳 |
| `subtitle` | string | ✓ | 一行副题，12—24 字，克制、非营销语 |
| `category` | string[] | ✓ | 2—4 个，如 `["地戏","屯堡"]` |
| `region` | string | ✓ | 如 `安顺市平坝区`、`镇宁自治县六马镇` |
| `coordinates` | `{lat,lng}` | ✓ | 十进制小数，真实地理位置近似值（误差 < 3km 可接受） |
| `chapter_index` | number | 镇宁条目 ✓ | 镇宁专栏九锚点序号：石0 银1 蜡2 戏3 糖4 李5 食6 自然7 夜线8；安顺条目填 0 |
| `scroll_anchor` | string | 镇宁条目 ✓ | `stone` `silver` `wax` `opera` `sugar` `plum` `food` `nature` `night`；安顺条目填 `""` |
| `hero_media` | object | ✓ | 见下 |
| `summary` | string | ✓ | **120—190 字**的可追溯重述：只陈述下方 claims 能支撑的内容，不做评价 |
| `claims` | Claim[] | ✓ | 3—8 条 |
| `subitems` | Subitem[] | 仅 C9 | 多子项条目，每项独立 claims |
| `route_points` | RoutePoint[] | 仅动线 | B1 / C13 / C14 |
| `sources` | Source[] | ✓ | 2—5 条 |
| `traceability` | `"A"\|"A/B"\|"B"\|"C"` | ✓ | 见等级判定 |
| `notes` | string | ✓ | 60—140 字：说明多说法并置情况、来源强弱、需人工核对项 |
| `tags` | string[] | ✓ | 3—6 个 |
| `related_entry_ids` | string[] | ✓ | 1—3 个同批次内或已知 id |
| `narrative` | `{hook, scene}` | ✓ | `hook` ≤ 30 字（可作章节大字的引子）；`scene` 60—120 字（沉浸段落，需与 claims 事实一致） |

## Claim

```json
{ "text": "一句可核验的陈述，30—80字", "source_ids": ["src_01"], "variant": "民间传说", "confidence": "direct" }
```

- `source_ids` 至少 1 个，必须存在于本条目 `sources` 中。
- `variant`：当同一事实存在两种以上说法时必须分组，如 `"民间传说"` / `"科研记载"`；无分歧时填 `"事实"`。
- `confidence`：`"direct"`（原文直接支持）| `"inferred"`（原文推得）| `"secondary"`（转述来源）。
- **不合并、不裁决**：多说法拆成独立 claim，各自绑 source_ids。

## Subitem

```json
{ "name": "染饭", "claims": [Claim, ...] }
```

## RoutePoint

```json
{ "name": "小十字", "order": 1, "coordinates": {"lat": 26.24, "lng": 105.93}, "note": "20—40字，仅陈述可核验内容", "source_ids": ["src_01"] }
```

动线条目需 4—7 个 route_point，order 从 1 递增。

## Source

```json
{
  "id": "src_01",
  "title": "原文标题（尽量与页面标题一致）",
  "url": "https://…（真实可访问 URL）",
  "publisher": "经济日报",
  "retrieved_at": "2026-11-14",
  "tier": "A",
  "excerpt": "原文关键句 30—60 字，逐字摘录",
  "media": { "type": "none" }
}
```

- `tier`：`A` 官方/政府/央媒/学术；`B` 主流媒体/机构媒体；`C` 自媒体/百科/未核实。
- `url` **必须是你在搜索中真实见到的地址**，不得编造。若某断言没有可引用 URL，就不要写这条 claim。
- `media` 一律 `{"type":"none"}`（本项目不做图片区）。
- `retrieved_at` 一律 `"2026-11-14"`。

## 等级判定

- `A`：核心断言均有 A 级来源，且无未决分歧。
- `A/B`：核心断言为 A 级，但含少量 B 级来源或存在并置说法。
- `B`：主要依赖 B 级来源。
- `C`：仅单一自媒体/百科来源，或来源未获取全文（如 C4、C7）。

## 硬性红线

1. 只写能由来源支撑的内容，**不得编造数字、年份、人名、地名、专名**。
2. 多说法并置时视觉权重相同，`notes` 里说明"两者并列不合并"，不得写"哪个更可信"。
3. 不使用营销语（"必去""绝美""打卡圣地"），用档案式陈述语气。
4. 每条 entry 的 claims 与 summary 必须自洽：summary 里出现的每个数字都要能在某条 claim 中找到。
