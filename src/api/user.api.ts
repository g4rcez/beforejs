import { ApiBefore } from "../before";

export default ApiBefore.route("/user/:id", [
    {
        handler: (req, res) => res.send(`Hello user ${req.params.id}`),
        method: "get",
    },
]);
