import "./style.css";
import OBR from "@owlbear-rodeo/sdk";

OBR.onReady(async () => {
    await OBR.contextMenu.create({
        id: "alinktothepaste.context-menu",
        icons: [
            {
                icon: "/icon.svg",
                label: "Special Paste",
                filter: {
                    min: 0,
                    max: 0,
                },
            },
        ],
        embed: {
            url: "/context-menu.html",
            height: 201,
        },
    });
});
