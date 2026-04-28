import { Select, MenuItem, ListSubheader, type SelectProps } from "@mui/material";
import { useCategories } from "@/hooks/useCategories";
import { CategoryGroup } from "@/types/category.types";

interface CategorySelectProps extends Omit<SelectProps<string>, "children"> {
  includeAll?: boolean;
  /** "id" (default) — value is UserCategory.id; "name" — value is UserCategory.name */
  valueBy?: "id" | "name";
  /** When set, only show categories matching this type. null/undefined = show all */
  categoryType?: "expense" | "income";
}

function filterTree(tree: CategoryGroup[], categoryType?: "expense" | "income"): CategoryGroup[] {
  if (!categoryType) return tree;

  const filtered = tree
    .map((group) => ({
      ...group,
      items: group.items.filter((cat) => {
        const catType = cat.type ?? "expense";
        return catType === categoryType;
      }),
    }))
    .filter((group) => group.items.length > 0);

  // Fallback: if no categories match the type, show all (avoids empty dropdown)
  return filtered.length > 0 ? filtered : tree;
}

export function CategorySelect({ includeAll = false, valueBy = "id", categoryType, ...props }: CategorySelectProps) {
  const { tree } = useCategories();
  const visibleTree = filterTree(tree, categoryType);

  return (
    <Select {...props}>
      {includeAll && <MenuItem value="">All categories</MenuItem>}
      {visibleTree.map((group) =>
        group.group !== null
          ? [
              <ListSubheader key={`header-${group.group}`}>{group.group}</ListSubheader>,
              ...group.items.map((cat) => (
                <MenuItem key={cat.id} value={valueBy === "id" ? cat.id : cat.name} sx={{ pl: 3 }}>
                  {cat.name.replace(`${group.group} - `, "")}
                </MenuItem>
              )),
            ]
          : group.items.map((cat) => (
              <MenuItem key={cat.id} value={valueBy === "id" ? cat.id : cat.name}>
                {cat.name}
              </MenuItem>
            ))
      )}
    </Select>
  );
}
