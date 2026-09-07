package cn.lx.worldcoffee.common.result;

public class Constant {
    /**
     * JWT 签名密钥：优先读环境变量 MICROSERVICES_JWT_SECRET（README 已要求设置），
     * 未设置时回退到本地开发默认值（48 字节，满足 jjwt HMAC-SHA ≥256 位要求）。
     * 生产环境务必通过环境变量设置独立密钥并定期轮换。
     */
    public static final String JWT_SECRET =
            System.getenv().getOrDefault("MICROSERVICES_JWT_SECRET",
                    "651750f4d19af08620c53edaf6dde0a7779f401740683d124c8c67ad105c748e5a1be1675d5695a4acff0a52f4c7eaf6");
    public static final long JWT_EXPIRATION = 7 * 24 * 60 * 60 * 1000L; // 7天
}