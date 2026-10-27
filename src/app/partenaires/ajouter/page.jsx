"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Container, Snackbar, TextField, Typography } from "@mui/material";
import { adminApi } from "@/lib/client/admin-api";

export default function AddPartner() {
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ open: false, severity: "success", text: "" });

  useEffect(() => {
    let active = true;
    Promise.all([adminApi("/api/admin/users"), adminApi("/api/admin/partners")])
      .then(([usersResponse, partnersResponse]) => {
        if (!active) return;
        setUsers(usersResponse.users || []);
        setPartners(partnersResponse.partners || []);
      })
      .catch(error => { if (active) setMessage({ open: true, severity: "error", text: error.message }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const candidates = useMemo(() => {
    const assigned = new Set(partners.map(p => p.uid || p.id));
    return users.filter(user => user.id && !assigned.has(user.id) && !user.isPartner && !["blocked", "disabled"].includes(user.status));
  }, [users, partners]);

  const assign = async () => {
    if (!selected?.id) return;
    setSaving(true);
    try {
      await adminApi("/api/admin/partners", { method: "POST", body: JSON.stringify({ uid: selected.id }) });
      setPartners(prev => [...prev, { id: selected.id, uid: selected.id, status: "pending" }]);
      setSelected(null);
      setMessage({ open: true, severity: "success", text: "Utilisateur assigné comme commissionnaire (en attente d’activation)." });
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
          <Button variant="contained" onClick={assign} disabled={!selected || saving}>{saving ? "Attribution en cours…" : "Assigner comme commissionnaire"}</Button>
        </>}
      </CardContent></Card>
      <Snackbar open={message.open} autoHideDuration={5000} onClose={() => setMessage(prev => ({ ...prev, open: false }))}>
        <Alert severity={message.severity} onClose={() => setMessage(prev => ({ ...prev, open: false }))}>{message.text}</Alert>
      </Snackbar>
    </Container>
  );
}
