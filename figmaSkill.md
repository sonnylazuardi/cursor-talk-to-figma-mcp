# Figma MCP Skill

## Стратегия работы с Figma через MCP

### Принцип: Запрашивай минимум данных, двигайся от общего к частному

---

## 1. Разведка структуры (первый запрос)

Получи общую структуру с минимальной глубиной:

```json
{
  "nodeId": "...",
  "transform": {
    "maxDepth": 1,
    "maxChildren": 20,
    "typeFilter": { "exclude": ["VECTOR", "LINE", "ELLIPSE", "BOOLEAN_OPERATION"] },
    "simplifyStyles": true,
    "includeMetadata": true
  }
}
```

Это даст id, name, type детей и метаданные `_childrenCount`, `_truncated` для понимания размера.

---

## 2. Целевой запрос нужных нод

После определения интересующих нод, запрашивай их с нужными полями:

```json
{
  "nodeId": "конкретный-id",
  "transform": {
    "maxDepth": 2,
    "propertyFilter": {
      "include": ["id", "name", "type", "characters", "fills", "layoutMode", "itemSpacing"]
    },
    "simplifyStyles": true
  }
}
```

---

## 3. Итеративное погружение

Для больших деревьев используй пагинацию:

```json
{
  "nodeId": "...",
  "transform": {
    "maxDepth": 1,
    "pagination": { "page": 0, "pageSize": 20 },
    "includeMetadata": true
  }
}
```

Метаданные `_pagination.totalPages` покажут сколько ещё страниц.

---

## Параметры transform

| Параметр | Назначение |
|----------|-----------|
| `maxDepth` | Глубина дерева (0 = только сама нода) |
| `maxChildren` | Лимит детей на уровень |
| `typeFilter.exclude` | Исключить типы: `["VECTOR", "LINE", "ELLIPSE", "BOOLEAN_OPERATION"]` |
| `typeFilter.include` | Только эти типы: `["FRAME", "TEXT", "COMPONENT", "INSTANCE"]` |
| `propertyFilter.include` | Только нужные поля |
| `propertyFilter.exclude` | Исключить тяжёлые: `["absoluteBoundingBox", "relativeTransform"]` |
| `simplifyStyles` | Упростить fills/strokes до `{type, color, opacity}` |
| `includeMetadata` | Добавить `_path`, `_truncated`, `_childrenCount` |
| `pagination` | `{page: 0, pageSize: 20}` для больших списков |

---

## Типичные сценарии

### Найти все текстовые ноды

```json
{
  "transform": {
    "maxDepth": 10,
    "typeFilter": { "include": ["TEXT", "FRAME", "GROUP", "COMPONENT", "INSTANCE"] },
    "propertyFilter": { "include": ["id", "name", "type", "characters"] }
  }
}
```

### Получить структуру layout

```json
{
  "transform": {
    "maxDepth": 3,
    "propertyFilter": {
      "include": ["id", "name", "type", "layoutMode", "itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]
    }
  }
}
```

### Получить стили компонентов

```json
{
  "transform": {
    "typeFilter": { "include": ["COMPONENT", "INSTANCE", "FRAME"] },
    "simplifyStyles": true,
    "maxDepth": 2
  }
}
```

---

## Метаданные ответа

При `includeMetadata: true` ноды содержат:

| Поле | Описание |
|------|----------|
| `_path` | Путь от корня: `"Page / Frame / Component"` |
| `_truncated` | `true` если нода обрезана по `maxDepth` |
| `_childrenCount` | Количество детей у обрезанной ноды |
| `_childrenTruncated` | Сколько детей пропущено из-за `maxChildren` |
| `_excluded` | `true` если нода исключена по типу (при `excludeMode: "stub"`) |
| `_pagination` | `{page, pageSize, totalChildren, totalPages}` |

---

## Важно

- **Без параметра `transform`** — возвращается полный ответ (старое поведение)
- **Всегда начинай с `maxDepth: 1`** для разведки структуры
- **Используй `includeMetadata: true`** чтобы видеть что обрезано
- **`_truncated: true`** означает что у ноды есть дети, но они не загружены
- **`_childrenTruncated: N`** показывает сколько детей пропущено

---

## Инструменты с поддержкой transform

- `get_document_info`
- `get_selection`
- `read_my_design`
- `get_node_info`
- `get_nodes_info`
- `get_styles`
- `get_local_components`
- `scan_text_nodes`
- `scan_nodes_by_types`
- `get_annotations`
- `get_instance_overrides`
- `get_reactions`
