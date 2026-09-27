---
title: "Chọn biện pháp thi công tầng hầm: 10 yếu tố và 2 bài toán thực tế"
description: "Tóm tắt từ buổi đào tạo nội bộ tôi thực hiện cho đội ngũ giám sát: cách chọn biện pháp phần ngầm, những gì phải kiểm tra khi thiết kế, và các ngưỡng quan trắc cần nhớ."
categories: practice
topic: basement
tags: [tầng hầm, semi top-down, tường vây, quan trắc, Plaxis]
read_time: 6
featured: true
---

Năm 2022, tôi cùng đồng nghiệp xây dựng một buổi đào tạo nội bộ cho đội ngũ giám sát về **lựa chọn, thiết kế và lưu ý thi công phần ngầm**. Lý do rất thực tế: giám sát trẻ năng động, nhưng nhiều bạn chưa hình dung hết rủi ro của phần hầm và hậu quả nếu sự cố xảy ra. Bài này tóm tắt những ý chính.

## 1. Sáu dạng biện pháp, không có dạng nào "tốt nhất"

| Biện pháp | Mạnh ở | Yếu ở |
|---|---|---|
| Đào mở vát taluy | Nhanh, rẻ khi đất tốt, mặt bằng rộng | Khối lượng đào và lấp lớn |
| Đào mở + tường chắn | Gọn mặt bằng | Chỉ phù hợp hố nông |
| Tường chắn + hệ chống (shoring) | Tăng độ cứng hệ chắn, hợp dự án xây chen | Vướng không gian đào; kém hiệu quả khi hố rộng |
| Tường chắn + neo đất | Thoáng, thi công nhanh | Kém với đất yếu, nước ngầm cao; neo kém chất lượng gây lún lớn |
| Semi top-down | Chuyển vị tường nhỏ, an toàn cho nhà lân cận | Tiến độ chậm, vận chuyển ngang thủ công |
| Full top-down | Chuyển vị nhỏ, đáp ứng tiến độ tổng | Chi phí cao (kingpost, cọc đỡ kết cấu phía trên) |

## 2. Mười yếu tố quyết định

Chúng tôi chấm từng phương án theo 10 yếu tố, chia làm hai nhóm:

- **Khách quan:** địa chất · ảnh hưởng công trình lân cận · giải pháp kết cấu · quy mô và chiều sâu đào · mặt bằng hiện trạng · điều kiện thi công.
- **Chủ quan:** chi phí · tiến độ · mong muốn chủ đầu tư · năng lực nhà thầu.

Mỗi yếu tố "bỏ phiếu" cho một hoặc vài phương án. Phương án được nhiều yếu tố quan trọng ủng hộ nhất sẽ được đưa vào thiết kế chi tiết.

## 3. Hai bài toán thực tế

| | Dự án A | Dự án B |
|---|---|---|
| Quy mô | 2 hầm, 31 tầng nổi | 2 hầm, 25 tầng nổi |
| Tường chắn | Barrette 600 mm, sâu 18,5–21,5 m | Tường vây 600 mm, dài 18 m |
| Đáy đào sâu nhất | −13,3 m (bể xử lý nước thải) | −14,35 m (hố móng bể) |
| Địa chất | Sét dẻo cứng 7–9 m trên cát bụi dày ~32 m | **Bùn nhão 4,5 m**, á sét dẻo mềm, cát pha, sét dẻo cứng |
| Nước ngầm | −3,0 m | **−0,8 m, dao động theo thủy triều** |
| Lân cận | 3 mặt giáp nhà dân 1–4 tầng, 1 mặt đường lớn đông xe | Nhà dân 1–4 tầng, nhà kho, hẻm và đường chính |

**Dự án A:** địa chất khá tốt nên các yếu tố kỹ thuật chấp nhận cả semi top-down lẫn bottom-up. Chi phí và tiến độ là hai yếu tố nghiêng hẳn về **bottom-up**.

**Dự án B:** lớp bùn nhão trên cùng và mực nước ngầm gần mặt đất làm rủi ro chuyển vị tường và lún nhà lân cận tăng mạnh. **Semi top-down** được chọn: sàn tầng trệt và sàn B1 thi công trước để làm hệ chống, có lỗ mở để đào đất bên dưới.

## 4. Thiết kế xong, cần kiểm tra những gì?

Với dự án B, chúng tôi dùng **Plaxis** cho các mặt cắt hố đào (thông số từ các hố khoan đại diện) và **Etabs** cho hệ sàn và kingpost chịu tải thi công. Danh mục kiểm tra gồm:

1. Hệ số ổn định tổng thể hố đào
2. Chuyển vị tường vây
3. Khả năng chịu lực và nứt tường vây (gia cường thép nếu thiếu)
4. Lún nền công trình lân cận
5. Ổn định chống cát sôi
6. Số lượng giếng hạ mực nước ngầm
7. Khả năng chịu lực kingpost
8. Gia cường dầm, sàn chịu tải thi công
9. Hệ shoring gia cường lỗ mở sàn B1
10. Gối đỡ bê tông

## 5. Các ngưỡng quan trắc nên nhớ

- **Chuyển vị ngang tường chắn:** vượt giá trị cảnh báo thì phát cảnh báo; vượt giá trị dừng thì **dừng thi công** và tìm phương án xử lý.
- **Lún nhà lân cận** (theo TCVN 9381:2012): đáng lo khi tốc độ lún trên 2 mm/tháng kéo dài 2 tháng mà không có dấu hiệu dừng, hoặc khi nhà lún lệch và nghiêng quá giới hạn.
- **Mực nước ngầm ngoài tường vây:** hạ ≥ 0,5 m so với chu kỳ đầu thì cảnh báo; hạ ≥ 1 m thì dừng hoặc giảm số giếng bơm.
- **Neo đất:** cường độ thiết kế lấy bằng 0,65 lần lực kéo đứt tối thiểu của cáp (BS 8081), và phải kiểm tra thường xuyên các neo bị chùng.

> **Điều tôi muốn mọi giám sát nhớ:** mọi thay đổi biện pháp đều phải được **định lượng bằng số liệu kỹ thuật**. Hiểu kỹ thuật để làm an toàn, không phải để dùng kỹ xảo.

<div class="angle" markdown="1">
Góc nghiên cứu

### Khi Plaxis gặp số liệu quan trắc

Ở cả hai dự án, mô hình Plaxis được lập **một lần** trước khi đào, còn số liệu quan trắc (inclinometer, lún, mực nước) chỉ được so với ngưỡng cố định. Nếu ghép hai nguồn này lại, sau mỗi giai đoạn đào ta có thể **hiệu chỉnh ngược** thông số đất (đặc biệt là lớp bùn nhão, vốn có độ bất định lớn nhất) bằng cập nhật Bayes, rồi dự báo chuyển vị cho giai đoạn kế tiếp.

Làm như vậy, "ma trận 10 yếu tố" ở trên sẽ được bổ sung một yếu tố mới mà hiện nay chưa ai đo được: **mức độ tin cậy của chính mô hình thiết kế**.
</div>
