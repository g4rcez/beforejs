import { register } from "../server";

export default register("/test/:id", [
    {
        handler: (req, res) => res.send(req.params.id),
        method: "get",
    },
]);
