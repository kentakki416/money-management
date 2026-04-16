import { logger } from "../log"
import { CreatePaymentSourceInput, PaymentSourceRepository } from "../repository/mysql"
import { PaymentSource } from "../types/domain"
import { ok, Result } from "../types/result"

/**
 * 支払い元一覧をユーザーIDで取得する
 */
export const getPaymentSources = async (
  userId: number,
  paymentSourceRepository: PaymentSourceRepository
): Promise<Result<PaymentSource[]>> => {
  logger.debug("PaymentSourceService: Fetching payment sources", { userId })
  const paymentSources = await paymentSourceRepository.findByUserId(userId)
  logger.debug("PaymentSourceService: Payment sources fetched", { count: paymentSources.length })
  return ok(paymentSources)
}

/**
 * 支払い元を作成する
 */
export const createPaymentSource = async (
  data: CreatePaymentSourceInput,
  paymentSourceRepository: PaymentSourceRepository
): Promise<Result<PaymentSource>> => {
  logger.debug("PaymentSourceService: Creating payment source", { name: data.name })
  const paymentSource = await paymentSourceRepository.create(data)
  logger.debug("PaymentSourceService: Payment source created", { id: paymentSource.id })
  return ok(paymentSource)
}

/**
 * 支払い元を削除する
 */
export const deletePaymentSource = async (
  id: number,
  paymentSourceRepository: PaymentSourceRepository
): Promise<Result<{ deleted: true }>> => {
  logger.debug("PaymentSourceService: Deleting payment source", { id })
  await paymentSourceRepository.deleteById(id)
  logger.debug("PaymentSourceService: Payment source deleted", { id })
  return ok({ deleted: true })
}
