import fs from "fs";
import Path from "path";

export const init = async (): Promise<void> =>
    new Promise((resolve) => {
        const path = Path.resolve(process.cwd(), ".cache", "pages");
        const exists = fs.existsSync(path);
        if (!exists) {
            fs.mkdirSync(path, { recursive: true });
            return resolve();
        }
        return resolve();
    });
