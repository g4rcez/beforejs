import { Before } from "../before";

export default Before.route("/user/:id", [
    {
        handler: (req, res) => res.send(`Hello user ${req.params.id}`),
        method: "get",
    },
]);
