import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import {
    getSharedItems,
    isValidJson,
    setMissingOwners,
    setNewIds,
    setOwner,
    setPosition,
    setVisible,
} from "./json-helpers.js";

const form = document.querySelector("#paste-options");
const ownershipPlayer = document.querySelector("#ownership-player");
let isObrReady = false;
let roomPlayers = [];

OBR.onReady(async () => {
    applyTheme(await OBR.theme.getTheme());
    OBR.theme.onChange(applyTheme);

    updateRoomPlayers(await OBR.party.getPlayers());
    OBR.party.onChange(updateRoomPlayers);
    isObrReady = true;
});

form.addEventListener("change", (event) => {
    if (event.target.name === "ownership") {
        updateOwnershipPlayerVisibility();
    }
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        if (!isObrReady) {
            throw new Error("Owlbear Rodeo is not ready yet.");
        }

        const clipboardText = await navigator.clipboard.readText();
        if (!isValidJson(clipboardText)) {
            throw new TypeError("The clipboard does not contain valid JSON.");
        }

        const clipboardJson = JSON.parse(clipboardText);
        const options = Object.fromEntries(new FormData(form));

        await applyPasteOptions(clipboardJson, options);
        const items = getSharedItems(clipboardJson);
        await OBR.scene.items.addItems(items);
        await OBR.player.select(
            items.map((item) => item.id),
            true,
        );
        await OBR.notification.show(
            `${items.length} item${items.length === 1 ? "" : "s"} pasted`,
            "SUCCESS",
        );
    } catch (error) {
        const message = getErrorMessage(error);
        console.error("Unable to paste the clipboard JSON:", message, error);

        if (OBR.isReady) {
            await OBR.notification.show(message, "ERROR");
        }
    }
});

function getErrorMessage(error) {
    let current = error;

    while (current && typeof current === "object" && "error" in current) {
        current = current.error;
    }

    if (current instanceof Error || typeof current?.message === "string") {
        return current.message;
    }

    if (typeof current === "string") {
        return current;
    }

    try {
        const serialized = JSON.stringify(current);
        if (serialized && serialized !== "{}") {
            return serialized;
        }
    } catch {
        // Fall through to the generic message.
    }

    return "An unexpected error occurred while pasting.";
}

async function applyPasteOptions(json, options) {
    if (options.id === "new") {
        setNewIds(json);
    }

    if (options.ownership === "take") {
        setOwner(json, await OBR.player.id);
    } else if (options.ownership === "give") {
        const recipient = roomPlayers.find(
            (player) => player.id === options.ownerPlayerId,
        );

        if (!recipient) {
            throw new Error("The selected player is no longer in the room.");
        }

        setOwner(json, recipient.id);
    } else {
        setMissingOwners(json, await OBR.player.id);
    }

    if (options.visible !== "unchanged") {
        setVisible(json, options.visible === "yes");
    }

    if (options.position === "here") {
        const [width, height] = await Promise.all([
            OBR.viewport.getWidth(),
            OBR.viewport.getHeight(),
        ]);
        const viewportCenter = await OBR.viewport.inverseTransformPoint({
            x: width / 2,
            y: height / 2,
        });

        setPosition(json, viewportCenter);
    }
}

function updateRoomPlayers(players) {
    const selectedPlayerId = ownershipPlayer.value;
    roomPlayers = players;
    ownershipPlayer.replaceChildren(
        ...players.map((player) => {
            const option = document.createElement("option");
            option.value = player.id;
            option.textContent = player.name;
            return option;
        }),
    );

    if (players.some((player) => player.id === selectedPlayerId)) {
        ownershipPlayer.value = selectedPlayerId;
    }

    updateOwnershipPlayerVisibility();
}

function updateOwnershipPlayerVisibility() {
    const giveOwnership =
        form.elements.namedItem("ownership").value === "give";
    ownershipPlayer.hidden = !giveOwnership;
    ownershipPlayer.disabled = !giveOwnership;
}

function applyTheme(theme) {
    const root = document.documentElement;

    root.style.colorScheme = theme.mode.toLowerCase();
    root.style.setProperty("--text", theme.text.secondary);
    root.style.setProperty("--text-strong", theme.text.primary);
    root.style.setProperty("--background", theme.background.default);
    root.style.setProperty("--control-background", theme.background.paper);
    root.style.setProperty("--border", theme.text.disabled);
    root.style.setProperty("--accent", theme.primary.main);
    root.style.setProperty("--accent-text", theme.primary.contrastText);
}
