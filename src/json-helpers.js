
export function isValidJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}

export function getSharedItems(json) {
    return Object.values(json["items"]["shared"]);
}

export function setNewIds(json) {
    const shared = json["items"]["shared"];
    const idMap = new Map(
        Object.entries(shared).map(([key, item]) => [
            item["id"] ?? key,
            crypto.randomUUID(),
        ]),
    );

    json["items"]["shared"] = Object.fromEntries(
        Object.entries(shared).map(([key, item]) => {
            const previousId = item["id"] ?? key;
            const id = idMap.get(previousId);
            item["id"] = id;

            if (item["attachedTo"] && idMap.has(item["attachedTo"])) {
                item["attachedTo"] = idMap.get(item["attachedTo"]);
            }

            return [id, item];
        }),
    );

    return json;
}

export function setOwner(json, owner) {
    getSharedItems(json).forEach(item => {
        item["createdUserId"] = owner;
    });
    return json;
}

export function setMissingOwners(json, fallbackOwner) {
    getSharedItems(json).forEach(item => {
        if (!item["createdUserId"]) {
            item["createdUserId"] =
                item["lastModifiedUserId"] ?? fallbackOwner;
        }
    });
    return json;
}

export function setVisible(json, visible) {
    getSharedItems(json).forEach(item => {
        item["visible"] = visible;
    });
    return json;
}

export function setPosition(json, position) {
    const positionedItems = getSharedItems(json).filter(
        (item) =>
            Number.isFinite(item["position"]?.x) &&
            Number.isFinite(item["position"]?.y),
    );

    if (positionedItems.length === 0) {
        return json;
    }

    const xs = positionedItems.map((item) => item["position"].x);
    const ys = positionedItems.map((item) => item["position"].y);
    const center = {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
    const offset = {
        x: position.x - center.x,
        y: position.y - center.y,
    };

    positionedItems.forEach((item) => {
        item["position"] = {
            x: item["position"].x + offset.x,
            y: item["position"].y + offset.y,
        };
    });

    return json;
}
