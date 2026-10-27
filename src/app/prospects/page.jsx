"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Container, FormControl,
  InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography
} from "@mui/material";
import { adminApi } from "@/lib/client/admin-api";

const statuses = [
  ["", "Tous les statuts"], ["new", "Nouveau"], ["contacted", "Contacté"],
  ["qualified", "Qualifié"], ["in_progress", "En cours"], ["closed", "Clôturé"]
];
const reasons = [
  ["not_interested", "Non intéressé"], ["unreachable", "Injoignable"],
  ["vehicle_unavailable", "Véhicule indisponible"], ["duplicate", "Doublon"],
  ["completed", "Traitement terminé"], ["other", "Autre"]
];

export default function ProspectsPage() {
  const detailRequest = useRef(0);
  const [filters, setFilters] = useState({
    status: "", productId: "", commissionnaireId: "", assignedTo: "", from: "", to: ""
  });
  const [draft, setDraft] = useState(filters);
  const [cursor, setCursor] = useState(null);
  const [pages, setPages] = useState([]);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "20" });
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      if (cursor) params.set("cursor", cursor);
      const result = await adminApi("/api/admin/contact-requests?" + params);
      setItems(result.items || []);
      setNextCursor(result.nextCursor || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, cursor]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    let active = true;
    adminApi("/api/admin/contact-requests/staff").then(result => {
      if (active) setStaff(result.staff || []);
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const openDetail = async (id) => {
    const requestNumber = ++detailRequest.current;
    setError("");
    setSelected(id);
    setDetail(null);
    try {
      const result = await adminApi("/api/admin/contact-requests/" + encodeURIComponent(id));
      if (requestNumber !== detailRequest.current) return;
      setDetail(result);
      setEdit({
        status: result.prospect.status,
        assignedTo: result.prospect.assignedTo || "",
        closedReason: result.prospect.closedReason || "",
        closedComment: result.prospect.closedComment || ""
      });
    } catch (err) { if (requestNumber === detailRequest.current) setError(err.message); }
  };

  const save = async () => {
    if (!detail) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await adminApi("/api/admin/contact-requests/" + encodeURIComponent(detail.prospect.id), {
        method: "PATCH",
        body: JSON.stringify({
          status: edit.status,
          assignedTo: edit.assignedTo.trim() || null,
          closedReason: edit.status === "closed" ? edit.closedReason || null : null,
          closedComment: edit.status === "closed" ? edit.closedComment : ""
        })
      });
      setNotice("Prospect mis à jour.");
      await Promise.all([load(), openDetail(detail.prospect.id)]);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPages([]);
    setCursor(null);
    setFilters({ ...draft });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Prospects</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Suivi des demandes de contact pour les annonces commissionnaires.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Paper component="form" onSubmit={applyFilters} sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} flexWrap="wrap" gap={2}>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Statut</InputLabel>
            <Select label="Statut" value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))}>
              {statuses.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </Select>
          </FormControl>
          {[
            ["productId", "Identifiant véhicule"],
            ["commissionnaireId", "Commissionnaire"],
            ["assignedTo", "Responsable"]
          ].map(([key, label]) => (
            <TextField key={key} size="small" label={label} value={draft[key]}
              onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))} />
          ))}
          <TextField size="small" type="date" label="Du" slotProps={{ inputLabel: { shrink: true } }}
            value={draft.from} onChange={e => setDraft(p => ({ ...p, from: e.target.value }))} />
          <TextField size="small" type="date" label="Au" slotProps={{ inputLabel: { shrink: true } }}
            value={draft.to} onChange={e => setDraft(p => ({ ...p, to: e.target.value }))} />
          <Button type="submit" variant="contained">Filtrer</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Demandes</Typography>
        {loading ? <CircularProgress size={26} /> : items.length === 0 ? (
          <Typography color="text.secondary">Aucun prospect pour ces critères.</Typography>
        ) : items.map(item => (
          <Box key={item.id} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box sx={{ flex: 1, minWidth: 210 }}>
              <Typography fontWeight={700}>Véhicule : {item.productName || item.productId || "Non renseigné"}</Typography>
              <Typography variant="body2" color="text.secondary">
                Acheteur : {item.buyerId || "—"} · Commissionnaire : {item.commissionnaireId || "—"}
              </Typography>
              <Typography variant="caption">{item.createdAt ? new Date(item.createdAt).toLocaleString("fr-FR") : "Date inconnue"}</Typography>
            </Box>
            <Chip label={statuses.find(([key]) => key === item.status)?.[1] || item.status} />
            <Typography variant="body2">Responsable : {item.assignedTo || "Non affecté"}</Typography>
            <Button variant="outlined" size="small" onClick={() => openDetail(item.id)}>Détail</Button>
          </Box>
        ))}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button disabled={loading || pages.length === 0} onClick={() => {
            const previous = [...pages];
            setCursor(previous.pop() || null);
            setPages(previous);
          }}>Précédent</Button>
          <Button disabled={loading || !nextCursor} onClick={() => {
            setPages(p => [...p, cursor]);
            setCursor(nextCursor);
          }}>Suivant</Button>
        </Stack>
      </Paper>

      {selected && <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Détail du prospect</Typography>
          <Button onClick={() => { detailRequest.current++; setSelected(null); setDetail(null); }}>Fermer</Button>
        </Stack>
        {!detail ? <CircularProgress size={26} /> : <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Référence : {detail.prospect.id} · Acheteur : {detail.prospect.buyerId} ·
            Commissionnaire : {detail.prospect.commissionnaireId}
          </Typography>
          <Stack gap={2} sx={{ maxWidth: 500 }}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select label="Statut" value={edit.status || "new"} onChange={e => setEdit(p => ({ ...p, status: e.target.value }))}>
                {statuses.filter(([value]) => value).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Responsable Motuka</InputLabel>
              <Select label="Responsable Motuka" value={edit.assignedTo || ""}
                onChange={e => setEdit(p => ({ ...p, assignedTo: e.target.value }))}>
                <MenuItem value="">Non affecté</MenuItem>
                {edit.assignedTo && !staff.some(person => person.uid === edit.assignedTo) &&
                  <MenuItem value={edit.assignedTo}>Responsable actuel ({edit.assignedTo})</MenuItem>}
                {staff.map(person => <MenuItem key={person.uid} value={person.uid}>
                  {person.displayName} ({person.role})
                </MenuItem>)}
              </Select>
            </FormControl>
            {edit.status === "closed" && <>
              <FormControl fullWidth>
                <InputLabel>Motif de clôture</InputLabel>
                <Select label="Motif de clôture" value={edit.closedReason || ""}
                  onChange={e => setEdit(p => ({ ...p, closedReason: e.target.value }))}>
                  {reasons.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField multiline minRows={2} label="Commentaire" value={edit.closedComment || ""}
                onChange={e => setEdit(p => ({ ...p, closedComment: e.target.value }))} />
            </>}
            <Button variant="contained" disabled={saving || (edit.status === "closed" && (!edit.closedReason || (edit.closedReason === "other" && !edit.closedComment?.trim())))} onClick={save}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </Stack>
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Historique</Typography>
          {detail.history.length === 0 ? <Typography>Aucune action enregistrée.</Typography> :
            detail.history.map(event => (
              <Box key={event.id} sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="body2">{event.action} · {event.actorId} · {event.createdAt || "Date inconnue"}</Typography>
                <Typography variant="caption">Statut : {event.before?.status || "—"} → {event.after?.status || "—"}</Typography>
              </Box>
            ))}
        </>}
      </Paper>}
    </Container>
  );
}
