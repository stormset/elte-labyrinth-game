const resources = [];

export class Resources {
    static addResource(id, type, properties = {}) {
        let obj = new type();
        for (const [property, value] of Object.entries(properties))
            obj[property] = value

        resources.push({"id": id, "res": obj});
    }

    static removeResource(id) {
        const index = resources.find(r => r.id === id);
        if (index !== -1)
            resources.splice(index, 1);
    }

    static getResource(id) {
        const resourceInfo = resources.find(r => r.id === id);
        if (resourceInfo !== undefined)
            return resourceInfo.res;
    }
}