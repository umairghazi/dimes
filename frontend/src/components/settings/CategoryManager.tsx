import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/RestoreFromTrash";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useCategories } from "@/hooks/useCategories";
import { UserCategory } from "@/types/category.types";

// ── Edit / rename dialog ──────────────────────────────────────────────────────

interface EditDialogProps {
  category: UserCategory | null;
  onClose: () => void;
  onSave: (id: string, name: string) => Promise<void>;
}

function EditDialog({ category, onClose, onSave }: EditDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!category || !name.trim()) return;
    setSaving(true);
    try {
      await onSave(category.id, name.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!category} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Rename category</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add category dialog ───────────────────────────────────────────────────────

interface AddDialogProps {
  open: boolean;
  defaultGroup?: string;
  onClose: () => void;
  onAdd: (name: string, group?: string) => Promise<unknown>;
}

function AddDialog({ open, defaultGroup, onClose, onAdd }: AddDialogProps) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState(defaultGroup ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setGroup(defaultGroup ?? "");
    }
  }, [open, defaultGroup]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd(name.trim(), group.trim() || undefined);
      setName("");
      setGroup(defaultGroup ?? "");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add category</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Childcare"
          />
          <TextField
            fullWidth
            label="Group (optional)"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. Home, Car - leave blank for standalone"
            helperText="Leave blank to create a standalone category"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => void handleAdd()} disabled={saving || !name.trim()}>
          {saving ? "Adding…" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CategoryManager() {
  const { tree, categories, loading, error, addCategory, updateCategory, deleteCategory, restoreCategory } =
    useCategories({ includeDeleted: true });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editTarget, setEditTarget] = useState<UserCategory | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addGroupDefault, setAddGroupDefault] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  const deletedCategories = categories.filter((c) => c.deletedAt !== null);

  const toggleGroup = (group: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const openAddInGroup = (group: string) => {
    setAddGroupDefault(group);
    setAddOpen(true);
  };

  const handleSaveEdit = async (id: string, name: string) => {
    await updateCategory(id, { name });
  };

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Categories</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => { setAddGroupDefault(undefined); setAddOpen(true); }}
        >
          Add category
        </Button>
      </Box>

      {/* Active categories */}
      <List disablePadding>
        {tree.filter((g) => g.items.some((c) => !c.deletedAt)).map((group, gi) => {
          const activeItems = group.items.filter((c) => !c.deletedAt);
          if (activeItems.length === 0) return null;

          const isGroup = group.group !== null;
          const groupKey = group.group ?? `standalone-${gi}`;
          const isExpanded = !isGroup || expanded.has(groupKey);

          return (
            <Box key={groupKey}>
              {gi > 0 && <Divider />}

              {isGroup ? (
                <ListItem
                  disablePadding
                  sx={{ px: 0 }}
                  secondaryAction={
                    <Tooltip title={`Add subcategory to ${group.group}`}>
                      <IconButton size="small" onClick={() => openAddInGroup(group.group!)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", py: 1, px: 0, flexGrow: 1 }}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{group.group}</Typography>
                    <Typography variant="caption" color="text.secondary">({activeItems.length})</Typography>
                  </Box>
                </ListItem>
              ) : null}

              <Collapse in={isExpanded} timeout="auto">
                <List disablePadding>
                  {activeItems.map((cat) => (
                    <ListItem
                      key={cat.id}
                      disablePadding
                      sx={{ pl: isGroup ? 3 : 0 }}
                      secondaryAction={
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Rename">
                            <IconButton size="small" onClick={() => setEditTarget(cat)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => void deleteCategory(cat.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {isGroup ? cat.name.replace(`${group.group} - `, "") : cat.name}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>

      {/* Deleted categories */}
      {deletedCategories.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider />
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, mb: 1, cursor: "pointer" }}
            onClick={() => setShowDeleted((v) => !v)}
          >
            {showDeleted ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Deleted categories
            </Typography>
            <Chip label={deletedCategories.length} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
          </Box>

          <Collapse in={showDeleted}>
            <List disablePadding>
              {deletedCategories.map((cat) => (
                <ListItem
                  key={cat.id}
                  disablePadding
                  sx={{ opacity: 0.5 }}
                  secondaryAction={
                    <Tooltip title="Restore">
                      <IconButton size="small" onClick={() => void restoreCategory(cat.id)}>
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ textDecoration: "line-through" }}>
                        {cat.name}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      <EditDialog
        category={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
      />

      <AddDialog
        open={addOpen}
        defaultGroup={addGroupDefault}
        onClose={() => setAddOpen(false)}
        onAdd={addCategory}
      />
    </Box>
  );
}
