package cn.lx.worldcoffee.module.shop.domain.vo;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class OrderVOTest {

    @Test
    void shouldExposeUnambiguousCouponAmountsWithoutChangingLegacyTotalAmount() {
        OrderVO order = OrderVO.builder()
                .totalAmount(new BigDecimal("80.00"))
                .discountAmount(new BigDecimal("20.00"))
                .build();

        assertThat(order.getTotalAmount()).isEqualByComparingTo("80.00");
        assertThat(order.getPayAmount()).isEqualByComparingTo("80.00");
        assertThat(order.getOriginalAmount()).isEqualByComparingTo("100.00");
    }
}
