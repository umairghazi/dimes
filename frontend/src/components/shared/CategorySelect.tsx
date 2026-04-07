import { Select, MenuItem, ListSubheader, type SelectProps } from "@mui/material";
import { CATEGORY_TREE, type ExpenseCategory } from "@/types/expense.types";

interface CategorySelectProps extends Omit<SelectProps<string>, "children"> {
  includeAll?: boolean;
}

export function CategorySelect({ includeAll = false, ...props }: CategorySelectProps) {
  return (
    <Select {...props}>
      {includeAll && <MenuItem value="">All categories</MenuItem>}
      {CATEGORY_TREE.map((group) =>
        group.children.length === 1 && group.children[0] === group.parent
          ? // Standalone category — no subheader needed
            <MenuItem key={group.parent} value={group.parent}>{group.parent}</MenuItem>
          : // Group with subcategories
            [
              <ListSubheader key={`header-${group.parent}`}>{group.parent}</ListSubheader>,
              ...group.children.map((child: ExpenseCategory) => (
                <MenuItem key={child} value={child} sx={{ pl: 3 }}>
                  {child.replace(`${group.parent} - `, "")}
                </MenuItem>
              )),
            ]
      )}
    </Select>
  );
}
