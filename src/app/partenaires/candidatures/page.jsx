"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Container, Divider, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import { adminApi } from "@/lib/client/admin-api";

const statusLabels = { pending: "En attente", approved: "Approuvée", rejected: "Refusée" };
const statusColors = { pending: "warning", approved: "success", rejected: "error" };

export default function PartnerApplicationsPage() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (next = null) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "20" });
      if (status !== "all") query.set("status", status);
      if (next) query.set("cursor", next);
      const result = await adminApi("/api/admin/partner-applications?" + query);
      setItems(result.applications || []);
      setCursor(next);
      setNextCursor(result.nextCursor || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { load(); setSelected(null); }, [load]);

  const openDetail = async (uid) => {
    setDetailLoading(true);
    setError("");
    try {
      const result = await adminApi("/api/admin/partner-applications/" + encodeURIComponent(uid));
      setSelected(result);
    } catch (e) { setError(e.message); }
    finally { setDetailLoading(false); }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "start", sm: "center" }} gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Candidatures commissionnaires</Typography>
          <Typography color="text.secondary">Consultation des dossiers — décisions administratives en préparation.</Typography>
        </Box>
        <Button href="/partenaires" variant="outlined">Partenaires actifs</Button>
      </Stack>
      <FormControl size="small" sx={{ minWidth: 220, mb: 3 }}>
        <InputLabel>Statut</InputLabel>
        <Select label="Statut" value={status} onChange={e => setStatus(e.target.value)}>
          <MenuItem value="all">Toutes les candidatures</MenuItem>
          {Object.entries(statusLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
        </Select>
      </FormControl>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress aria-label="Chargement des candidatures" /> : (
        <Stack spacing={1.5}>
          {items.length === 0 && <Alert severity="info">Aucune candidature trouvée.</Alert>}
          {items.map(item => (
            <Paper key={item.uid} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "start", sm: "center" }} justifyContent="space-between" gap={2}>
                <Box>
                  <Typography fontWeight={700}>{item.fullName || "Candidat sans nom"}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.city || "Ville non renseignée"} · {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("fr-FR") : "Date inconnue"}</Typography>
                </Box>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Chip size="small" label={statusLabels[item.status] || "Inconnu"} color={statusColors[item.status] || "default"} />
                  <Button onClick={() => openDetail(item.uid)} variant="outlined" disabled={detailLoading}>Consulter</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {nextCursor && <Button disabled={loading} onClick={() => load(nextCursor)}>Page suivante</Button>}
          {cursor && <Button onClick={() => load()}>Revenir à la première page</Button>}
        </Stack>
      )}
      {detailLoading && <CircularProgress size={22} sx={{ mt: 3 }} />}
      {selected && !detailLoading && (
        <Paper variant="outlined" sx={{ mt: 4, p: 3, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight={700}>Dossier : {selected.application.fullName}</Typography>
            <Button onClick={() => setSelected(null)}>Fermer</Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography><strong>Ville :</strong> {selected.application.city}</Typography>
          <Typography><strong>Statut candidature :</strong> {statusLabels[selected.application.status] || "Inconnu"}</Typography>
          <Typography><strong>Droit partenaire :</strong> {selected.partner.isPartner ? "Actif" : "Inactif"}</Typography>
          <Typography><strong>Compte :</strong> {selected.partner.accountStatus}</Typography>
          {selected.application.phone && <Typography><strong>Téléphone :</strong> {selected.application.phone}</Typography>}
          <Typography mt={2} fontWeight={700}>Motivation</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{selected.application.motivation || "Non renseignée"}</Typography>
          <Typography mt={2} fontWeight={700}>Expérience</Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{selected.application.experience || "Non renseignée"}</Typography>
          <Typography mt={3} fontWeight={700}>Historique</Typography>
          {selected.history.length === 0 ? <Typography color="text.secondary">Aucun événement enregistré.</Typography> : selected.history.map(event => (
            <Box key={event.id} sx={{ py: 1 }}>
              <Typography variant="body2">{event.action} · {event.createdAt ? new Date(event.createdAt).toLocaleString("fr-FR") : "Date inconnue"}</Typography>
              {event.reason && <Typography variant="body2" color="text.secondary">{event.reason}</Typography>}
            </Box>
          ))}
          <Alert severity="info" sx={{ mt: 2 }}>Les décisions sont désactivées jusqu'à la validation des transactions et des permissions C2.3.</Alert>
        </Paper>
      )}
    </Container>
  );
}
