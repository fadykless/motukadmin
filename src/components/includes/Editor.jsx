"use client";
import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { Box, Typography, Paper } from "@mui/material";

export default function Editor() {
    const [content, setContent] = useState("");

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                {"Contenu de l'article"}
            </Typography>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    "& .ck-editor__editable": {
                        minHeight: "200px",
                        backgroundColor: "white",
                        borderRadius: 2,
                        border: "1px solid #ccc",
                        padding: 2,
                    },
                    "& .ck-toolbar": {
                        borderRadius: "12px 12px 0 0",
                    },
                }}
            >
                <CKEditor
                    editor={ClassicEditor}
                    data={content}
                    onChange={(event, editor) => {
                        const data = editor.getData();
                        setContent(data);
                    }}
                    config={{
                        toolbar: [
                            "heading",
                            "|",
                            "bold",
                            "italic",
                            "link",
                            "bulletedList",
                            "numberedList",
                            "|",
                            "undo",
                            "redo",
                        ],
                    }}
                />
            </Paper>
        </Box>
    );
}
