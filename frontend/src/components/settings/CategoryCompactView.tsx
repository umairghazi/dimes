import { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RepeatIcon from "@mui/icons-material/Repeat";
import { UserCategory, CategoryGroup } from "@/types/category.types";
import { Budget } from "@/types/budget.types";

interface Props {
  tree: CategoryGroup[];
  budgetMap: Map<string, Budget>;
  spentMap: Map<string, number>;
  onEdit: (cat: UserCategory) => void;
  onDelete: (cat: UserCategory) => void;
  onSetBudget: (categoryName: string, amount: number) => void;
  onClearBudget: (categoryName: string) => void;
  onToggleCarryForward: (categoryName: string) => void;
  onAddInGroup: (group: string) => void;
}

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

interface BudgetCellProps {
  budget: Budget | null;
  spent: number;
  onSet: (amount: number) => void;
  onClear: () => void;
  onToggleCarryForward: () => void;
}

function BudgetCell({ budget, spent, onSet, onClear, onToggleCarryForward }: BudgetCellProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setInput(budget ? String(budget.limitAmount) : "");
    setEditing(true);
  };

  const save = async () => {
    const amount = parseFloat(input);
    if (!isNaN(amount) && amount >= 0) {
      setSaving(true);
      try { onSet(amount); } finally { setSaving(false); }
    }
    setEditing(false);
  };

  const cancel = () => { setEditing(false); setInput(""); };

  if (editing) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <TextField
          size="small"
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          sx={{ width: 110 }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            htmlInput: { min: 0 },
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") cancel();
          }}
        />
        <IconButton size="small" color="primary" onClick={() => void save()} disabled={saving}>
          {saving ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 16 }} />}
        </IconButton>
        <IconButton size="small" onClick={cancel}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  if (budget) {
    const remaining = budget.limitAmount - spent;
    const percent = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;
    const remainColor = percent >= 90 ? "error.main" : percent >= 70 ? "warning.main" : "success.main";
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title="Click to edit">
          <Typography
            variant="body2"
            sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" }, fontVariantNumeric: "tabular-nums", minWidth: 56 }}
            onClick={startEdit}
          >
            {fmt(budget.limitAmount)}
          </Typography>
        </Tooltip>
        <Tooltip title={budget.carryForward ? "Repeats monthly — click to stop" : "Click to repeat every month"}>
          <IconButton size="small" onClick={onToggleCarryForward} sx={{ p: 0.25, color: budget.carryForward ? "primary.main" : "text.disabled" }}>
            <RepeatIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Remove budget">
          <IconButton size="small" onClick={onClear} sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "error.main" } }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" sx={{ color: remainColor, fontWeight: 600, fontVariantNumeric: "tabular-nums", ml: 0.5 }}>
          {fmt(remaining)} left
        </Typography>
      </Box>
    );
  }

  return (
    <Typography
      variant="body2"
      color="text.disabled"
      sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
      onClick={startEdit}
    >
      + Set budget
    </Typography>
  );
}

export function CategoryCompactView({
  tree, budgetMap, spentMap,
  onEdit, onDelete, onSetBudget, onClearBudget, onToggleCarryForward, onAddInGroup,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (group: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: "30%" }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Budget / month</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, width: 90, fontVariantNumeric: "tabular-nums" }}>Spent</TableCell>
            <TableCell sx={{ width: 56 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {tree.map((group) => {
            const isGroup = group.group !== null;
            const groupKey = group.group ?? "__standalone__";
            const isCollapsed = isGroup && collapsed.has(groupKey);

            return (
              <Box component="tbody" key={groupKey} sx={{ display: "contents" }}>
                {isGroup && (
                  <TableRow
                    sx={{ bgcolor: "action.hover", cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggle(groupKey)}
                  >
                    <TableCell colSpan={4} sx={{ py: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {isCollapsed
                          ? <ExpandMoreIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          : <ExpandLessIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        }
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {group.group}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({group.items.length})
                        </Typography>
                        <Tooltip title={`Add to ${group.group}`}>
                          <IconButton
                            size="small"
                            sx={{ ml: "auto", p: 0.25 }}
                            onClick={(e) => { e.stopPropagation(); onAddInGroup(group.group!); }}
                          >
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {!isCollapsed && group.items.map((cat) => {
                  const budget = budgetMap.get(cat.name) ?? null;
                  const spent = spentMap.get(cat.name) ?? 0;
                  const displayName = isGroup ? cat.name.replace(`${group.group} - `, "") : cat.name;

                  return (
                    <TableRow
                      key={cat.id}
                      hover
                      sx={{ "& .row-actions": { opacity: 0 }, "&:hover .row-actions": { opacity: 1 } }}
                    >
                      <TableCell sx={{ pl: isGroup ? 3 : 1.5 }}>
                        <Typography variant="body2">{displayName}</Typography>
                      </TableCell>
                      <TableCell>
                        <BudgetCell
                          budget={budget}
                          spent={spent}
                          onSet={(amount) => onSetBudget(cat.name, amount)}
                          onClear={() => onClearBudget(cat.name)}
                          onToggleCarryForward={() => onToggleCarryForward(cat.name)}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        <Typography variant="body2" color={spent > 0 ? "text.primary" : "text.disabled"}>
                          {fmt(spent)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ pr: 0.5 }}>
                        <Box className="row-actions" sx={{ display: "flex", transition: "opacity 0.15s" }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => onEdit(cat)} sx={{ p: 0.5 }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => onDelete(cat)} sx={{ p: 0.5 }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Box>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
