import { registerApi } from "../shared";

export default registerApi("/test/:id", [
    {
        handler: (req, res) => res.send(req.params.id),
        method: "get",
    },
]);
