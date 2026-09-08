package cn.lx.worldcoffee.gateway.filter;

import cn.lx.worldcoffee.common.result.Constant;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private final SecretKey key;
    private final ReactiveStringRedisTemplate redisTemplate;

    public JwtAuthFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.key = Keys.hmacShaKeyFor(Constant.JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        HttpMethod method = exchange.getRequest().getMethod();
        String path = exchange.getRequest().getURI().getPath();

        if (isOptionalAuthRequest(method, path)) {
            return filterOptionalAuth(exchange, chain);
        }

        if (isWhiteListRequest(method, path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange, "not logged in");
        }

        String token = authHeader.substring(7);
        return filterRequiredAuth(exchange, chain, token);
    }

    /**
     * Public community reads may carry a token, but do not require one.
     * Keeping the optional-auth boundary method-specific prevents writes and
     * user-owned feeds from becoming public accidentally.
     */
    private boolean isOptionalAuthRequest(HttpMethod method, String path) {
        if (HttpMethod.POST.equals(method) && "/api/coffee/feed-events".equals(path)) {
            return true;
        }
        if (!HttpMethod.GET.equals(method)) {
            return false;
        }
        if (path.equals("/api/coffee/posts")
                || path.equals("/api/coffee/posts/recommend")
                || path.equals("/api/coffee/posts/hot")
                || path.equals("/api/coffee/posts/topic")
                || path.equals("/api/coffee/topics")
                || path.equals("/api/coffee/search")
                || path.equals("/api/coffee/search/unified")) {
            return true;
        }

        String postPrefix = "/api/coffee/posts/";
        if (!path.startsWith(postPrefix)) {
            return false;
        }
        String postId = path.substring(postPrefix.length());
        return postId.matches("\\d+");
    }

    /**
     * Public endpoints are explicitly method-scoped. The previous prefix
     * matching made write endpoints under /api/shop/products and
     * /api/shop/categories unintentionally anonymous.
     */
    private boolean isWhiteListRequest(HttpMethod method, String path) {
        if (path.startsWith("/uploads/") || path.startsWith("/actuator/")) {
            return true;
        }
        if (HttpMethod.POST.equals(method)) {
            return path.equals("/api/user/login")
                    || path.equals("/api/user/register")
                    || path.equals("/api/users/login")
                    || path.equals("/api/users/register")
                    || path.equals("/api/admin/login");
        }
        if (!HttpMethod.GET.equals(method)) {
            return false;
        }
        if (path.equals("/api/shop/products")
                || path.equals("/api/shop/products/search")
                || path.equals("/api/shop/categories")
                || path.equals("/api/shop/seckill/activities")) {
            return true;
        }

        String productPrefix = "/api/shop/products/";
        if (!path.startsWith(productPrefix)) {
            return false;
        }
        String productId = path.substring(productPrefix.length());
        return productId.matches("\\d+");
    }

    private Mono<Void> filterOptionalAuth(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }
        return filterRequiredAuth(exchange, chain, authHeader.substring(7));
    }

    private Mono<Void> filterRequiredAuth(ServerWebExchange exchange, GatewayFilterChain chain, String token) {
        return redisTemplate.opsForSet()
                .isMember("token:blacklist", token)
                .onErrorReturn(false)
                .flatMap(blacklisted -> {
                    if (Boolean.TRUE.equals(blacklisted)) {
                        return unauthorized(exchange, "token invalid");
                    }
                    return continueWithToken(exchange, chain, token);
                });
    }

    private Mono<Void> continueWithToken(ServerWebExchange exchange, GatewayFilterChain chain, String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Long userId = Long.parseLong(claims.getSubject());
            String username = claims.get("username", String.class);

            ServerHttpRequest newRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", String.valueOf(userId))
                    .header("X-Username", username == null ? "" : username)
                    .build();

            return chain.filter(exchange.mutate().request(newRequest).build());
        } catch (JwtException | IllegalArgumentException e) {
            return unauthorized(exchange, "login expired");
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        String body = "{\"code\":401,\"message\":\"" + message + "\"}";
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
