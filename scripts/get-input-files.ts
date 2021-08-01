import glob from "glob";
import path from "path";
type InputOption = { [entryAlias: string]: string };

export const root = process.cwd();

const getBaseFiles = async (dir: string, map: (x: string) => string) => {
  return new Promise<InputOption>(async (res, rej) => {
    glob(dir, (err, files) =>
      err
        ? rej(err)
        : res(
            files.reduce(
              (acc, el) => ({
                ...acc,
                [map(el)]: el,
              }),
              {}
            )
          )
    );
  });
};

export const getSsrFiles = async () =>
  getBaseFiles(
    path.resolve(path.join(root, "src", "**/*.view.tsx")),
    (file: string) => `${path.basename(file, ".view.tsx")}.view`
  );
export const getHtmlFiles = async () =>
  getBaseFiles(
    path.resolve(path.join(root, "views", "**/*.html")),
    (file: string) => `${path.basename(file, ".html")}.html`
  );
