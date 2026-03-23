'use client'
import React from 'react'
import {
    EmailIcon,
    EmailShareButton,
    FacebookIcon,
    FacebookMessengerIcon,
    FacebookMessengerShareButton,
    FacebookShareButton,
    LinkedinIcon,
    LinkedinShareButton,
    TelegramIcon,
    TelegramShareButton,
    TwitterIcon,
    TwitterShareButton,
    WhatsappIcon,
    WhatsappShareButton,
} from "react-share";

const SharedButtons = ({ url }) => {
    return (
        <>
            <EmailShareButton url={url}>
                <EmailIcon size={32} style={{ marginRight: 3 }} round={true} />
            </EmailShareButton>
            <TwitterShareButton url={url}>
                <TwitterIcon size={32} style={{ marginRight: 3 }} round={true} />
            </TwitterShareButton>
            <FacebookShareButton url={url}>
                <FacebookIcon size={32} style={{ marginRight: 3 }} round={true} />
            </FacebookShareButton>
            <WhatsappShareButton url={url}>
                <WhatsappIcon size={32} style={{ marginRight: 3 }} round={true} />
            </WhatsappShareButton>
            <LinkedinShareButton url={url}>
                <LinkedinIcon size={32} style={{ marginRight: 3 }} round={true} />
            </LinkedinShareButton>
            <TelegramShareButton url={url}>
                <TelegramIcon size={32} style={{ marginRight: 3 }} round={true} />
            </TelegramShareButton>
            <FacebookMessengerShareButton url={url}>
                <FacebookMessengerIcon size={32} style={{ marginRight: 3 }} round={true} />
            </FacebookMessengerShareButton>
        </>
    )
}

export default SharedButtons