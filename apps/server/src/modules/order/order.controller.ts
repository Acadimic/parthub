import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { IOrderCheckout } from '@repo/shared/interfaces';
import {
  ApplyOrderCouponDto,
  CouponDto,
  CreateOrderDto,
  OrderDto,
  VerifyOrderPaymentDto,
} from '@repo/shared/validations';
import { RequestContextService } from '../../context/request-context.service';
import { CouponService } from './coupon.service';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly couponService: CouponService,
    private readonly requestContextService: RequestContextService,
  ) {}

  // ---- the teacher's side ----

  /** Makes an order from a plan and returns it with the code its link carries. */
  @Post('create')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_PLAN)
  async create(@Body() payload: CreateOrderDto): Promise<OrderDto> {
    return this.orderService.create(this.requestContextService.getOrgId(), payload);
  }

  @Get('all')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_PLAN)
  async getOrders(): Promise<OrderDto[]> {
    return this.orderService.getByOrg(this.requestContextService.getOrgId());
  }

  @Get('coupons')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.VIEW_PLAN)
  async getCoupons(): Promise<CouponDto[]> {
    return this.couponService.getByOrg(this.requestContextService.getOrgId());
  }

  @Post('coupon/upsert')
  @Subdomains(Subdomain.TEACH)
  @Permissions(PermissionItem.MANAGE_PLAN)
  async upsertCoupon(@Body() payload: CouponDto): Promise<CouponDto> {
    return this.couponService.upsert(this.requestContextService.getOrgId(), payload);
  }

  // ---- the buyer's side ----

  /** What the link shows. Public: the link is the invitation, and a buyer may not have an account yet. */
  @Public()
  @Get('link/:code')
  async getByCode(@Param('code') code: string): Promise<OrderDto> {
    return this.orderService.getByCode(code);
  }

  @Get('my')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getMyOrders(): Promise<OrderDto[]> {
    return this.orderService.getByBuyer(this.requestContextService.getUserId());
  }

  @Post('link/:code/coupon')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async applyCoupon(@Param('code') code: string, @Body() payload: ApplyOrderCouponDto): Promise<OrderDto> {
    return this.orderService.applyCoupon(code, payload.code);
  }

  @Post('link/:code/coupon/remove')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async removeCoupon(@Param('code') code: string): Promise<OrderDto> {
    return this.orderService.removeCoupon(code);
  }

  @Post('link/:code/checkout')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async checkout(@Param('code') code: string): Promise<IOrderCheckout<OrderDto>> {
    return this.orderService.checkout(this.requestContextService.getUserId(), code);
  }

  @Post('link/:code/verify')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async verify(@Param('code') code: string, @Body() payload: VerifyOrderPaymentDto): Promise<OrderDto> {
    return this.orderService.verifyPayment(this.requestContextService.getUserId(), code, payload);
  }
}
