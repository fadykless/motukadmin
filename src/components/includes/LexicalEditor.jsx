"use client";
import React from "react";
import { Paper, Typography, IconButton, Stack } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import TitleIcon from "@mui/icons-material/Title";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

import { $getSelection, $isRangeSelection } from "lexical";
import {
    $createParagraphNode,
    $createHeadingNode,
    HeadingTagType,
} from "@lexical/rich-text";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { FORMAT_TEXT_COMMAND } from "lexical";

const theme = {
    paragraph: "editor-paragraph",
};

function onError(error) {
    console.error("Lexical error:", error);
}

/** Barre d'outils simple */
function Toolbar({ editor }) {
    const applyBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    const applyItalic = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    const insertUnorderedList = () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    const insertOrderedList = () =>
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    const clearList = () => editor.dispatchCommand(REMOVE_LIST_COMMAND);

    const applyHeading = (level) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const heading = $createHeadingNode(`h${level}`);
                heading.append(...selection.extract());
                selection.insertNodes([heading]);
            }
        });
    };

    return (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <IconButton onClick={applyBold} size="small">
                <FormatBoldIcon />
            </IconButton>
            <IconButton onClick={applyItalic} size="small">
                <FormatItalicIcon />
            </IconButton>
            <IconButton onClick={() => applyHeading(1)} size="small">
                <TitleIcon fontSize="small" />
                <Typography variant="caption">H1</Typography>
            </IconButton>
            <IconButton onClick={() => applyHeading(2)} size="small">
                <TitleIcon fontSize="small" />
                <Typography variant="caption">H2</Typography>
            </IconButton>
            <IconButton onClick={insertUnorderedList} size="small">
                <FormatListBulletedIcon />
            </IconButton>
            <IconButton onClick={insertOrderedList} size="small">
                <FormatListNumberedIcon />
            </IconButton>
            <IconButton onClick={clearList} size="small">
                ❌
            </IconButton>
        </Stack>
    );
}

export default function LexicalEditor({ onChange, placeholder }) {
    const initialConfig = {
        namespace: "CustomEditor",
        theme,
        onError,
        editable: true,
    };

    const [editorInstance, setEditorInstance] = React.useState(null);

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <Paper
                sx={{
                    minHeight: 250,
                    padding: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                }}
            >
                {/* Toolbar */}
                {editorInstance && <Toolbar editor={editorInstance} />}

                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="editor-input"
                            style={{
                                minHeight: "200px",
                                outline: "none",
                                fontFamily: "Arial, sans-serif",
                            }}
                        />
                    }
                    placeholder={
                        <Typography color="text.secondary">
                            {placeholder || "Commencez à écrire ici..."}
                        </Typography>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <OnChangePlugin
                    onChange={(editorState, editor) => {
                        setEditorInstance(editor);
                        editorState.read(() => {
                            const json = JSON.stringify(editorState);
                            onChange && onChange(json);
                        });
                    }}
                />
            </Paper>
        </LexicalComposer>
    );
}
