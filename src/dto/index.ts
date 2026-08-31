import { IsUUID, IsInt, Min, Max, IsNotEmpty, IsString } from "class-validator";

export class ReserveStockDto {
    @IsUUID()
    productId!: string;

    @IsInt()
    @Min(1)
    @Max(10000)
    quantity!: number;
}

export class CheckoutDto {
    @IsUUID()
    reservationId!: string;
}
