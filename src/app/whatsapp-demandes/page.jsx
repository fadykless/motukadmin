"use client";
import {useCallback, useEffect, useState} from "react";
import {Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography} from "@mui/material";
import {auth} from "@/firebase";
import {adminApi} from "@/lib/client/admin-api";

const labels = {new: "À traiter", in_progress: "Pris en charge", closed: "Clôturé"};
export default function WhatsAppRequestsPage() {
  const [items, setItems] = useState([]), [receiptKey, setReceiptKey] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const enabled = process.env.NEXT_PUBLIC_C2_EMULATOR_MODE === "true";
  const load = useCallback(async () => {
    if (!enabled) return;
    setBusy(true); setError("");
    try {const result = await adminApi("/api/admin/whatsapp-requests?limit=20"); setItems(result.items || []);}
    catch (err) {setError(err.message);}
    finally {setBusy(false);}
  }, [enabled]);
  useEffect(() => {load();}, [load]);
  const act = async (path, method, body) => {
    setBusy(true); setError(""); setNotice("");
    try {
      await adminApi(path, {method, body: JSON.stringify(body)});
      setNotice("Dossier de test mis à jour. Aucun client ni conseiller contacté.");
      await load();
    } catch (err) {await load(); setError(err.message);}
    finally {setBusy(false);}
  };
  if (!enabled) return <Alert severity="info">La file de démonstration WhatsApp est désactivée.</Alert>;
  return <Box>
    <Typography variant="h4" fontWeight={800} gutterBottom>Demandes de conseiller — test</Typography>
    <Alert severity="warning" sx={{mb: 2}}>Simulation locale uniquement. Ces dossiers ne sont pas des prospects réels. Aucun contact client, attribution commerciale ou consentement réel n’est établi.</Alert>
    {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{mb: 2}}>{notice}</Alert>}
    <Paper component="form" sx={{p: 2, mb: 2}} onSubmit={event => {
      event.preventDefault(); act("/api/admin/whatsapp-requests", "POST", {receiptKey: receiptKey.trim()});
    }}>
      <Stack direction={{xs: "column", sm: "row"}} spacing={2}>
        <TextField fullWidth label="Clé du reçu de test" value={receiptKey} onChange={event => setReceiptKey(event.target.value)} />
        <Button type="submit" variant="contained" disabled={busy || !/^[a-f0-9]{64}$/.test(receiptKey.trim())}>Importer</Button>
      </Stack>
      <Typography variant="caption">Le serveur relit le reçu préparé dans l’émulateur ; aucun contexte saisi dans ce formulaire n’est utilisé.</Typography>
    </Paper>
    <Stack direction="row" spacing={2} alignItems="center" sx={{mb: 2}}>
      <Button disabled={busy} onClick={load}>Actualiser</Button>
      <Typography variant="body2">20 dossiers maximum, dans une fenêtre des 100 plus récents. Liste partielle.</Typography>
      {busy && <CircularProgress size={22} />}
    </Stack>
    {!busy && items.length === 0 && <Typography>Aucune demande de test active dans cette fenêtre.</Typography>}
    {items.map(item => <Paper key={item.id} sx={{p: 2, mb: 2}}>
      <Stack spacing={1}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center"><Chip label={labels[item.state]} /><Typography variant="caption">Dossier {item.id}</Typography></Stack>
        <Typography>{item.context.scope === "selected" ? "Intention liée à une annonce" : item.context.scope === "selection_unavailable" ? "Intention générale : sélection devenue indisponible" : "Intention générale sans annonce"}</Typography>
        <Typography variant="body2">Besoin : {{sale: "Vente", rent: "Location", parts: "Pièces"}[item.context.criteria.type] || "À préciser"} · Ville : {item.context.criteria.city || "À préciser"} · Marque : {item.context.criteria.brand || "À préciser"}</Typography>
        <Typography variant="body2">Budget maximum : {item.context.criteria.budgetMax ?? "À préciser"} {item.context.criteria.currency || ""}{item.context.criteria.rentType ? " / " + ({day: "jour", week: "semaine", month: "mois"}[item.context.criteria.rentType]) : ""}</Typography>
        {item.context.offer && <Typography>{item.context.offer.type} · {item.context.offer.price} {item.context.offer.currency}{item.context.offer.rentType ? " / " + item.context.offer.rentType : ""} · <a href={item.context.offer.url} target="_blank" rel="noreferrer">Voir l’annonce</a></Typography>}
        <Typography variant="body2">Instantané historique du reçu ; prix et disponibilité à confirmer.</Typography>
        <Typography variant="body2">Responsable de test : {item.assignedTo || "Non pris en charge"}</Typography>
        <Typography variant="caption">Import : {new Date(item.createdAt).toLocaleString("fr-FR")} · Expiration : {new Date(item.expiresAt).toLocaleString("fr-FR")}</Typography>
        <Stack direction="row" gap={1}>
          {item.state === "new" && <Button disabled={busy} variant="outlined" onClick={() => act("/api/admin/whatsapp-requests/" + item.id, "PATCH", {action: "claim", expectedVersion: item.version})}>Prendre en charge ce test</Button>}
          {item.state === "in_progress" && item.assignedTo === auth.currentUser?.uid && <Button disabled={busy} variant="outlined" onClick={() => act("/api/admin/whatsapp-requests/" + item.id, "PATCH", {action: "close", expectedVersion: item.version})}>Clôturer mon dossier de test</Button>}
        </Stack>
        <Typography variant="caption">Audit : importé{item.audit.claimed ? " → pris en charge" : ""}{item.audit.closed ? " → clôturé" : ""}. Aucun message envoyé.</Typography>
      </Stack>
    </Paper>)}
  </Box>;
}
