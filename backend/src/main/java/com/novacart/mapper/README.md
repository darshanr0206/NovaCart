Entity <-> DTO mapping is currently done inline inside each service's `toResponse()`
method (see ProductServiceImpl, CartServiceImpl, OrderServiceImpl, etc.). If that
inline mapping grows unwieldy, extract it here as dedicated `ProductMapper`,
`OrderMapper`, etc. classes — the package is scaffolded and ready for that.
