package cn.lx.worldcoffee.module.shop.domain.vo;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderVO {
    private Long id;
    private String orderNo;         // 订单编号
    private Long userId;            // 所属用户ID（admin 后台需要）
    /** Actual payable amount, retained under the legacy totalAmount name. */
    private BigDecimal totalAmount;
    private Integer status;         // 0-待支付 1-已支付 2-已发货 3-已完成 4-已取消
    private String address;         // 收货地址
    private String remark;          // 备注
    private LocalDateTime createTime;
    private List<OrderItemVO> items;// 订单明细列表

    // 优惠券相关
    private Long couponId;          // 使用的优惠券ID
    private BigDecimal discountAmount; // 优惠金额
    private String couponName;      // 优惠券名称

    /** Original item subtotal before the coupon discount. */
    public BigDecimal getOriginalAmount() {
        if (totalAmount == null) {
            return null;
        }
        return totalAmount.add(discountAmount == null ? BigDecimal.ZERO : discountAmount);
    }

    /** Explicit canonical name for the amount persisted and sent to payment. */
    public BigDecimal getPayAmount() {
        return totalAmount;
    }

    @Data
    @Builder
    public static class OrderItemVO {
        private Long productId;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
    }
}
