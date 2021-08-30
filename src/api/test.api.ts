import { ApiBefore } from "../before";

export default ApiBefore.route(
    "/test/:id",
    [
        {
            handler: (req, res) => res.send(req.params.id),
            method: "get",
        },
    ],
    [
        (req, res, next) => {
            console.log({ id: req.params.id });
            if (req.params.id === "1") return next();
            return res.status(500).send({ error: true });
        },
    ]
);
