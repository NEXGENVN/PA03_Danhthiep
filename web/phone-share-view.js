import { notice } from './ui.js';
export function recipientFrame(content, { demo = false, hostname = '' } = {}) {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  return `<a class="share-brand" href="/">PA<span>03</span></a><p class="eyebrow">${demo ? 'Trải nghiệm bằng dữ liệu mẫu' : 'Chia sẻ liên hệ tự nguyện'}</p>${local ? notice('Liên kết localhost chỉ mở được trên máy này. Để người khác truy cập, người tạo cần triển khai trang qua địa chỉ HTTPS công khai.', 'warning') : ''}${content}`;
}
export function terminalText(status) {
  return ({
    shared: ['Đã nhận phản hồi chia sẻ', 'Yêu cầu đã nhận số điện thoại được người phản hồi đồng ý chia sẻ. Số này được ghi nhận là thông tin tự khai.'],
    declined: ['Yêu cầu đã bị từ chối', 'Không có số điện thoại nào được gửi qua phản hồi từ chối này.'],
    expired: ['Liên kết đã hết hạn', 'Yêu cầu này không nhận thêm phản hồi.'],
    revoked: ['Yêu cầu đã được hủy', 'Người tạo đã hủy liên kết này. Yêu cầu không nhận thêm phản hồi.'],
  })[status] || ['Yêu cầu không khả dụng', 'Liên hệ người tạo yêu cầu để biết thêm thông tin.'];
}
