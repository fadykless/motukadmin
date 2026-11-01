"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Container, Snackbar, TextField, Typography } from "@mui/material";
import { adminApi } from "@/lib/client/admin-api";

export default function AddPartner() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState({ open: false, severity: "success", text: "" });

  useEffect(() => {
    let active = true;
    adminApi("/api/admin/users")
      .then(usersResponse => {
        if (!active) return;
        setUsers(usersResponse.users || []);
      })
      .catch(error => { if (active) setMessage({ open: true, severity: "error", text: error.message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const candidates = useMemo(() => {
    return users.filter(user => user.id && !user.isPartner && !["blocked", "disabled"].includes(user.status));
  }, [users]);

  const assign = async () => {
    if (!selected?.id || !reason.trim()) return;
    setSaving(true);
    try {
      await adminApi("/api/admin/partners", { method: "POST", body: JSON.stringify({ uid: selected.id, reason: reason.trim() }) });
      setUsers(prev => prev.map(user => user.id === selected.id ? { ...user, isPartner: true } : user));
      setSelected(null);
      setReason("");
      setMessage({ open: true, severity: "success", text: "Utilisateur assigné comme commissionnaire." });
    } catch (error) {
      setMessage({ open: true, severity: "error", text: error.message });
    } finally { setSaving(false); }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>Assigner un commissionnaire</Typography>
      <Typography color="text.secondary" mb={3}>Sélectionnez un compte Motuka existant. Son profil sera récupéré automatiquement ; aucune nouvelle inscription n’est nécessaire.</Typography>
      <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent sx={{ p: 3 }}>
        {loading ? <CircularProgress size={24} /> : <>
          <Autocomplete
            options={candidates}
            value={selected}
            onChange={(_, value) => setSelected(value)}
            getOptionLabel={user => [user.displayName, user.email || user.phoneNumber].filter(Boolean).join(" — ") || user.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={params => <TextField {...params} label="Rechercher un utilisateur existant" placeholder="Nom, email ou téléphone" />}
          />
          <Box mt={2} mb={2}>
            {selected && <Typography variant="body2">Compte sélectionné : {selected.displayName || selected.email || selected.id}</Typography>}
            {!candidates.length && <Typography color="text.secondary" variant="body2">Aucun utilisateur éligible dans les résultats chargés.</Typography>}
          </Box>
          <TextField fullWidth multiline minRows={2} label="Justification de l’attribution exceptionnelle" value={reason} onChange={event => setReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} sx={{ mb: 2 }} required />
          <Button variant="contained" onClick={assign} disabled={!selected || !reason.trim() || saving}>{saving ? "Attribution en cours…" : "Assigner comme commissionnaire"}</Button>
        </>}
      </CardContent></Card>
      <Snackbar open={message.open} autoHideDuration={5000} onClose={() => setMessage(prev => ({ ...prev, open: false }))}>
        <Alert severity={message.severity} onClose={() => setMessage(prev => ({ ...prev, open: false }))}>{message.text}</Alert>
      </Snackbar>
    </Container>
  );
}
