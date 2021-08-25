import { register } from "../server";

export default register("/test/:id", ["get"], (req, res) => {
    res.send(req.params.id);
});
