import { Before } from "../before/before";

export default Before.route("/test/:id", [
    {
        handler: (req, res) => res.send(req.params.id),
        method: "get",
    },
]);
