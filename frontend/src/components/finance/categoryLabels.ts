import { FinanceCategory } from "@/api/finance.api";

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function stripParentPrefix(name: string, parentName: string): string {
  const escapedParent = parentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = name.replace(new RegExp(`^${escapedParent}\\s*(?:/|-|:)\\s*`, "i"), "").trim();
  return stripped || name;
}

function stripRepeatedPrefix(name: string, parts: string[]): string {
  let next = name.trim();
  let changed = true;

  while (changed) {
    changed = false;
    for (let length = Math.min(parts.length, 4); length >= 1; length -= 1) {
      const prefix = parts.slice(-length).join(" / ");
      const stripped = stripParentPrefix(next, prefix);
      if (normalize(stripped) !== normalize(next)) {
        next = stripped;
        changed = true;
        break;
      }
    }
  }

  return next;
}

export function categoryLabel(category: FinanceCategory): string {
  const source = category.path.length > 0 ? category.path : [{ id: category.id, name: category.name }];
  const parts: string[] = [];

  source.forEach((part) => {
    let name = part.name.trim();
    if (!name) return;

    if (parts.length > 0) {
      name = stripRepeatedPrefix(name, parts);
      const previous = parts[parts.length - 1];
      if (normalize(name) === normalize(previous)) return;
    }

    parts.push(name);
  });

  return parts.join(" / ") || category.name;
}
