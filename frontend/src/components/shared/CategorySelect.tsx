import { Select, MenuItem, ListSubheader, type SelectProps } from "@mui/material";
import { useCategories } from "@/hooks/useCategories";

interface CategorySelectProps extends Omit<SelectProps<string>, "children"> {
  includeAll?: boolean;
}

export function CategorySelect({ includeAll = false, ...props }: CategorySelectProps) {
  const { tree } = useCategories();

  return (
    <Select {...props}>
      {includeAll && <MenuItem value="">All categories</MenuItem>}
      {tree.map((group) =>
        group.group !== null
          ? [
              <ListSubheader key={`header-${group.group}`}>{group.group}</ListSubheader>,
              ...group.items.map((cat) => (
                <MenuItem key={cat.id} value={cat.name} sx={{ pl: 3 }}>
                  {cat.name.replace(`${group.group} - `, "")}
                </MenuItem>
              )),
            ]
          : group.items.map((cat) => (
              <MenuItem key={cat.id} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))
      )}
    </Select>
  );
}
