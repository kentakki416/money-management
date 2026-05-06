import { logger } from "../log"
import { CreatePaymentSourceInput, PaymentSourceRepository } from "../repository/mysql"
import { PaymentSource } from "../types/domain"
import { ok, Result } from "../types/result"

type PaymentSourceRepo = { paymentSourceRepository: PaymentSourceRepository }

/**
 * 支払い元一覧をユーザーIDで取得する
 */
export const getPaymentSources = async (
  userId: number,
  repo: PaymentSourceRepo
): Promise<Result<PaymentSource[]>> => {
  logger.debug("PaymentSourceService: Fetching payment sources", { userId })
  const paymentSources = await repo.paymentSourceRepository.findByUserId(userId)
  logger.debug("PaymentSourceService: Payment sources fetched", { count: paymentSources.length })
  return ok(paymentSources)
}

/**
 * 支払い元を作成する
 */
export const createPaymentSource = async (
  data: CreatePaymentSourceInput,
  repo: PaymentSourceRepo
): Promise<Result<PaymentSource>> => {
  logger.debug("PaymentSourceService: Creating payment source", { name: data.name })
  const paymentSource = await repo.paymentSourceRepository.create(data)
  logger.debug("PaymentSourceService: Payment source created", { id: paymentSource.id })
  return ok(paymentSource)
}

/**
 * 支払い元を削除する
 */
export const deletePaymentSource = async (
  id: number,
  repo: PaymentSourceRepo
): Promise<Result<{ deleted: true }>> => {
  logger.debug("PaymentSourceService: Deleting payment source", { id })
  await repo.paymentSourceRepository.deleteById(id)
  logger.debug("PaymentSourceService: Payment source deleted", { id })
  return ok({ deleted: true })
}
