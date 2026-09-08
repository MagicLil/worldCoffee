package cn.lx.worldcoffee.gateway;

import cn.lx.worldcoffee.gateway.filter.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class JwtAuthFilterTest {

    private final JwtAuthFilter filter = new JwtAuthFilter(mock(ReactiveStringRedisTemplate.class));

    @Test
    void shouldAllowAnonymousCommunityReadsButKeepWritesProtected() {
        assertThat(isOptional(HttpMethod.GET, "/api/coffee/posts")).isTrue();
        assertThat(isOptional(HttpMethod.GET, "/api/coffee/posts/42")).isTrue();
        assertThat(isOptional(HttpMethod.GET, "/api/coffee/search")).isTrue();
        assertThat(isOptional(HttpMethod.POST, "/api/coffee/feed-events")).isTrue();

        assertThat(isOptional(HttpMethod.GET, "/api/coffee/posts/my")).isFalse();
        assertThat(isOptional(HttpMethod.POST, "/api/coffee/posts")).isFalse();
        assertThat(isOptional(HttpMethod.POST, "/api/coffee/posts/42/like")).isFalse();
    }

    @Test
    void shouldNotExposeShopWritesThroughPublicReadRules() {
        assertThat(isWhiteListed(HttpMethod.GET, "/api/shop/products")).isTrue();
        assertThat(isWhiteListed(HttpMethod.GET, "/api/shop/products/42")).isTrue();
        assertThat(isWhiteListed(HttpMethod.GET, "/api/shop/products/search")).isTrue();
        assertThat(isWhiteListed(HttpMethod.GET, "/api/shop/seckill/activities")).isTrue();

        assertThat(isWhiteListed(HttpMethod.POST, "/api/shop/products")).isFalse();
        assertThat(isWhiteListed(HttpMethod.PUT, "/api/shop/products/42")).isFalse();
        assertThat(isWhiteListed(HttpMethod.POST, "/api/shop/seckill/buy")).isFalse();
    }

    private boolean isOptional(HttpMethod method, String path) {
        return ReflectionTestUtils.invokeMethod(filter, "isOptionalAuthRequest", method, path);
    }

    private boolean isWhiteListed(HttpMethod method, String path) {
        return ReflectionTestUtils.invokeMethod(filter, "isWhiteListRequest", method, path);
    }
}
