import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequestContextService } from '../../context/request-context.service';
import { Permissions } from '@decorators/permissions.decorator';
import { Subdomains } from '@decorators/subdomains.decorator';
import { PermissionItem, Subdomain } from '@repo/shared/enums';
import { IEnrollmentCheckout } from '@repo/shared/interfaces';
import { EnrollCourseDto, EnrollmentDto, VerifyEnrollmentPaymentDto } from '@repo/shared/validations';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly requestContextService: RequestContextService,
  ) {}

  /** The caller's own seats, across every course. */
  @Get('my')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async getMyEnrollments(): Promise<EnrollmentDto[]> {
    return this.enrollmentService.getByUser(this.requestContextService.getUserId());
  }

  /** Starts a seat: active at once when free, pending with a payment order when priced. */
  @Post('checkout')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async checkout(@Body() payload: EnrollCourseDto): Promise<IEnrollmentCheckout<EnrollmentDto>> {
    return this.enrollmentService.checkout(
      this.requestContextService.getOrgId(),
      this.requestContextService.getUserId(),
      payload,
    );
  }

  /** Settles a pending seat with the payment the checkout collected. */
  @Post('verify')
  @Subdomains(Subdomain.LEARN)
  @Permissions(PermissionItem.VIEW_COURSE)
  async verify(@Body() payload: VerifyEnrollmentPaymentDto): Promise<EnrollmentDto> {
    return this.enrollmentService.verifyPayment(this.requestContextService.getUserId(), payload);
  }
}
