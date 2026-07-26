
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
    getSharedItems(json).forEach(item => {
        item["position"] = { ...position };
    });
    return json;
}
